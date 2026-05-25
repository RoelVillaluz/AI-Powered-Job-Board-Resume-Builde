/**
 * Test script — runs reconciliation once and prints a full summary.
 * Safe to run multiple times (upserts are idempotent).
 *
 * Usage:
 *   npx tsx --env-file=.env.dev src/scripts/testReconciliation.ts
 *   npx tsx --env-file=.env.dev src/scripts/testReconciliation.ts --dry-run
 */
import "../config/env.js"
import { connectDB }      from "../config/db.js";
import { connectPinecone } from "../config/pinecone.js";
import { runReconciliation } from "../infrastructure/reconciliation/runners/reconciliationRunner.js";
import logger from "../utils/logger.js";

const dryRun = process.argv.includes('--dry-run');

const run = async () => {
    logger.info('─'.repeat(60));
    logger.info(`[TEST] Reconciliation script starting (dryRun=${dryRun})`);
    logger.info('─'.repeat(60));

    await connectDB();
    await connectPinecone();

    const summary = await runReconciliation({ dryRun });

    logger.info('─'.repeat(60));
    logger.info('[TEST] Reconciliation summary:');
    logger.info(`  dry run:     ${summary.dryRun}`);
    logger.info(`  skipped run: ${summary.skippedRun}`);
    logger.info('');
    logger.info('  Jobs:');
    logger.info(`    scanned:  ${summary.jobs.scanned}`);
    logger.info(`    repaired: ${summary.jobs.repaired}`);
    logger.info(`    failed:   ${summary.jobs.failed}`);
    logger.info(`    skipped:  ${summary.jobs.skipped}`);
    logger.info('');
    logger.info('  Resumes:');
    logger.info(`    scanned:  ${summary.resumes.scanned}`);
    logger.info(`    repaired: ${summary.resumes.repaired}`);
    logger.info(`    failed:   ${summary.resumes.failed}`);
    logger.info(`    skipped:  ${summary.resumes.skipped}`);
    logger.info('');
    logger.info('  Pinecone:');
    logger.info(`    scanned:  ${summary.pinecone.scanned}`);
    logger.info(`    repaired: ${summary.pinecone.repaired}`);
    logger.info(`    failed:   ${summary.pinecone.failed}`);
    logger.info(`    skipped:  ${summary.pinecone.skipped}`);
    logger.info('─'.repeat(60));

    if (summary.jobs.failed > 0 || summary.resumes.failed > 0 || summary.pinecone.failed > 0) {
        logger.warn('[TEST] Some items failed — check logs above for details');
        process.exit(1);
    }

    logger.info('[TEST] Done — check MongoDB + Pinecone to verify results');
    process.exit(0);
};

run().catch(err => {
    logger.error('[TEST] Unhandled error', err);
    process.exit(1);
});