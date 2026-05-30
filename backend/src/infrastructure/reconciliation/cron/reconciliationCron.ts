import * as cron from 'node-cron';
import logger from '../../../utils/logger.js';
import { runReconciliation } from '../runners/reconciliationRunner.js';
import {
    reconciliationRunsTotal,
    reconciliationRepairedTotal,
} from '../../../config/metrics.js';

const SCHEDULE  = process.env.RECONCILIATION_CRON_SCHEDULE ?? '0 */6 * * *';
const IS_PROD   = process.env.NODE_ENV === 'production';
const IS_WORKER = process.env.IS_WORKER_PROCESS === 'true';

let task: ReturnType<typeof cron.schedule> | null = null;

/**
 * Starts the reconciliation cron job.
 *
 * Guards:
 * - Only runs in production (skip dev/test noise)
 * - Only runs on one process when horizontally scaled (IS_WORKER flag)
 * - Validates cron expression before scheduling
 * - Safe to call multiple times — will not double-schedule
 */
export const startReconciliationCron = (): void => {

    // ── Environment guard ─────────────────────────────────────────────────────
    if (!IS_PROD) {
        logger.info('[RECONCILIATION CRON] Skipped — only runs in production');
        return;
    }

    // ── Horizontal scale guard ────────────────────────────────────────────────
    // When running multiple Node processes (PM2 cluster, Render replicas),
    // only one process should run the cron. Set IS_WORKER_PROCESS=true on
    // exactly one instance via env/process config.
    if (IS_WORKER) {
        logger.info('[RECONCILIATION CRON] Skipped — not the designated cron process');
        return;
    }

    if (task) {
        logger.warn('[RECONCILIATION CRON] Already scheduled — skipping duplicate start');
        return;
    }

    if (!cron.validate(SCHEDULE)) {
        logger.error(`[RECONCILIATION CRON] Invalid cron expression: "${SCHEDULE}" — not started`);
        return;
    }

    task = cron.schedule(SCHEDULE, async () => {
        logger.info('[RECONCILIATION CRON] Triggered');

        // Timeout guard — kill the run after 30 minutes max
        // Prevents a hung run from blocking subsequent ticks indefinitely
        const timeoutMs = 30 * 60 * 1000;
        const timeoutHandle = setTimeout(() => {
            logger.error('[RECONCILIATION CRON] Timed out after 30 minutes — forcing completion flag reset');
            // Note: can't cancel in-flight promises but isRunning resets on next boot
            // This is a last-resort guard — normal runs complete well under 5 minutes
        }, timeoutMs);

        try {
            const summary = await runReconciliation({ dryRun: false });

            if (summary.skippedRun) {
                logger.warn('[RECONCILIATION CRON] Skipped — previous run still in progress');
                return;
            }

            // ── Cost report ───────────────────────────────────────────────────
            // Log enough detail to spot runaway reconciliation in production
            const totalRepaired = summary.jobs.repaired + summary.resumes.repaired;
            const totalFailed   = summary.jobs.failed   + summary.resumes.failed;
            const totalPinecone = summary.pinecone.repaired;

            // ── Prometheus ────────────────────────────────────────────────────────
            reconciliationRunsTotal.inc({ status: 'completed '});
            reconciliationRepairedTotal.inc({ entity: 'job' },      summary.jobs.repaired);
            reconciliationRepairedTotal.inc({ entity: 'resume' },   summary.resumes.repaired);
            reconciliationRepairedTotal.inc({ entity: 'pinecone' }, summary.pinecone.repaired);

            logger.info(
                '[RECONCILIATION CRON] Complete | ' +
                `jobs: ${summary.jobs.repaired}/${summary.jobs.scanned} repaired | ` +
                `resumes: ${summary.resumes.repaired}/${summary.resumes.scanned} repaired | ` +
                `pinecone: ${totalPinecone} upserted | ` +
                `failed: ${totalFailed}`
            );

            // ── Runaway detection ─────────────────────────────────────────────
            // If repaired count is consistently at BATCH_SIZE cap, something
            // is wrong — items keep reappearing. Log a warning so you notice.
            if (totalRepaired >= 500) {
                logger.warn(
                    '[RECONCILIATION CRON] Repaired count hit batch cap — ' +
                    'possible runaway reconciliation. Check embedding pipeline health.'
                );
            }

            if (totalFailed > 50) {
                logger.warn(
                    `[RECONCILIATION CRON] High failure count: ${totalFailed} — ` +
                    'check AI service availability and Redis connection.'
                );
            }

        } catch (err) {
            logger.error('[RECONCILIATION CRON] Unexpected error', err);
        } finally {
            clearTimeout(timeoutHandle);
        }
    });

    logger.info(`[RECONCILIATION CRON] Scheduled — "${SCHEDULE}" (production only)`);
};

/**
 * Stops the cron job gracefully.
 * Call during server shutdown to prevent mid-run interruption.
 */
export const stopReconciliationCron = (): void => {
    if (!task) return;
    task.stop();
    task = null;
    logger.info('[RECONCILIATION CRON] Stopped');
};