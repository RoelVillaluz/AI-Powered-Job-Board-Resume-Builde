import pLimit from 'p-limit';
import logger from "../../../utils/logger.js";
import { ReconciliationResult } from "../types/reconciliation.types.js"
import {
    findJobsWithoutEmbeddingsRepo,
    findJobsWithStaleEmbeddingsRepo,
} from "../../../repositories/jobPostings/jobEmbeddingRepositories.js";
import {
    findResumesWithoutEmbeddingsRepo,
    findResumesWithStaleEmbeddingsRepo,
} from "../../../repositories/resumes/resumeEmbeddingRepository.js";
import { enqueueJobPostingEmbeddingService }  from "../../../services/jobPostings/jobPostingEmbeddingService.js";
import { enqueueResumeEmbeddingServiceV2 }    from "../../../services/resumes/resumeEmbeddingServiceV2.js";
import { getPineconeIndex }                   from "../../../config/pinecone.js";
import { handleResumeVectorUpsert, handleJobVectorUpsert } from "../../pinecone/pineconeAfterSave.js";
import ResumeEmbedding      from "../../../models/resumes/resumeEmbeddingsModel.js";
import JobPostingEmbedding  from "../../../models/jobPostings/jobPostingEmbeddingModel.js";
import Resume               from "../../../models/resumes/resumeModel.js";
import { RECONCILIATION_BATCH_SIZE } from "../constants/reconciliationConstants.js";
import { fetchAllPineconeIds } from '../../../infrastructure/pinecone/pineconePaginator.js';

// Max concurrent enqueue operations — keeps Redis pressure low
const ENQUEUE_CONCURRENCY = 10;

// Guard against overlapping cron runs
let isRunning = false;

export interface ReconciliationSummary {
    jobs:       ReconciliationResult;
    resumes:    ReconciliationResult;
    pinecone:   ReconciliationResult;
    dryRun:     boolean;
    skippedRun: boolean;
}

export const runReconciliation = async ({
    dryRun = false,
} = {}): Promise<ReconciliationSummary> => {

    // ── Overlap guard ─────────────────────────────────────────────────────────
    if (isRunning) {
        logger.warn('[RECONCILIATION] Previous run still in progress — skipping');
        return {
            jobs:     { scanned: 0, repaired: 0, failed: 0, skipped: 0 },
            resumes:  { scanned: 0, repaired: 0, failed: 0, skipped: 0 },
            pinecone: { scanned: 0, repaired: 0, failed: 0, skipped: 0 },
            dryRun,
            skippedRun: true,
        };
    }

    isRunning = true;
    logger.info(`[RECONCILIATION] Started (dryRun=${dryRun})`);
    const start = Date.now();

    try {
        // Capture cutoff BEFORE enqueuing. reconcilePineconeVectors will only
        // process embedding docs that existed prior to this run. Docs created
        // by the workers we're about to enqueue won't be written to MongoDB
        // until after the workers complete, so they're naturally excluded.
        // The cutoff eliminates the tight window between enqueue finishing and
        // reconcilePineconeVectors starting where a fast worker could write a
        // doc that the gap-fill would then redundantly re-upsert.
        const runStartedAt = new Date();

        // Jobs + resumes enqueue in parallel — they're independent of each other
        const [jobResult, resumeResult] = await Promise.all([
            reconcileJobEmbeddings(dryRun),
            reconcileResumeEmbeddings(dryRun),
        ]);

        // Pinecone gap-fill runs only after both enqueue phases complete.
        // It only touches embedding docs that existed before this run started —
        // newly-enqueued docs get their Pinecone upsert via the afterSave hook
        // once their worker finishes, which is the correct path for them.
        const pineconeResult = await reconcilePineconeVectors(dryRun, runStartedAt);

        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        logger.info(
            `[RECONCILIATION] Complete in ${elapsed}s | ` +
            `jobs: ${jobResult.repaired} repaired | ` +
            `resumes: ${resumeResult.repaired} repaired | ` +
            `pinecone: ${pineconeResult.repaired} upserted`
        );

        return { jobs: jobResult, resumes: resumeResult, pinecone: pineconeResult, dryRun, skippedRun: false };

    } finally {
        isRunning = false;
    }
};


// ── Job embedding reconciliation ──────────────────────────────────────────────

async function reconcileJobEmbeddings(dryRun: boolean): Promise<ReconciliationResult> {
    const result: ReconciliationResult = { scanned: 0, repaired: 0, failed: 0, skipped: 0 };
    const limit = pLimit(ENQUEUE_CONCURRENCY);

    const missing = await findJobsWithoutEmbeddingsRepo(RECONCILIATION_BATCH_SIZE);
    result.scanned += missing.length;
    logger.info(`[RECONCILIATION] Jobs missing embeddings: ${missing.length}`);

    const stale = await findJobsWithStaleEmbeddingsRepo(RECONCILIATION_BATCH_SIZE);
    result.scanned += stale.length;
    logger.info(`[RECONCILIATION] Jobs with stale embeddings: ${stale.length}`);

    if (dryRun) {
        result.skipped = result.scanned;
        return result;
    }

    // Deduplicate by jobPosting ID — a job could appear in both lists
    const jobIds = new Map<string, string>();
    missing.forEach((j: any) => jobIds.set(j._id.toString(), j._id.toString()));
    stale.forEach((j: any)   => jobIds.set(j.jobPosting.toString(), j.jobPosting.toString()));

    if (jobIds.size > RECONCILIATION_BATCH_SIZE) {
        logger.warn(
            `[RECONCILIATION] Job enqueue count ${jobIds.size} exceeds batch size — ` +
            `capping at ${RECONCILIATION_BATCH_SIZE}`
        );
    }

    const toEnqueue = [...jobIds.values()].slice(0, RECONCILIATION_BATCH_SIZE);

    await Promise.allSettled(
        toEnqueue.map(id => limit(async () => {
            try {
                await enqueueJobPostingEmbeddingService(id);
                result.repaired++;
            } catch (err) {
                result.failed++;
                logger.error(`[RECONCILIATION] Failed enqueue job: ${id}`, err);
            }
        }))
    );

    return result;
}


// ── Resume embedding reconciliation ──────────────────────────────────────────

async function reconcileResumeEmbeddings(dryRun: boolean): Promise<ReconciliationResult> {
    const result: ReconciliationResult = { scanned: 0, repaired: 0, failed: 0, skipped: 0 };
    const limit = pLimit(ENQUEUE_CONCURRENCY);

    const missing = await findResumesWithoutEmbeddingsRepo(RECONCILIATION_BATCH_SIZE);
    result.scanned += missing.length;
    logger.info(`[RECONCILIATION] Resumes missing embeddings: ${missing.length}`);

    const stale = await findResumesWithStaleEmbeddingsRepo(RECONCILIATION_BATCH_SIZE);
    result.scanned += stale.length;
    logger.info(`[RECONCILIATION] Resumes with stale embeddings: ${stale.length}`);

    if (dryRun) {
        result.skipped = result.scanned;
        return result;
    }

    const toEnqueue = new Map<string, { resumeId: string; userId: string }>();

    for (const r of missing as any) {
        toEnqueue.set(r._id.toString(), {
            resumeId: r._id.toString(),
            userId:   r.user?.toString() ?? '',
        });
    }

    if (stale.length > 0) {
        const staleResumeIds = stale.map((r: any) => r.resume);
        const resumeDocs = await Resume
            .find({ _id: { $in: staleResumeIds } }, { _id: 1, user: 1 })
            .lean();

        for (const r of resumeDocs) {
            toEnqueue.set(r._id.toString(), {
                resumeId: r._id.toString(),
                userId:   (r as any).user?.toString() ?? '',
            });
        }
    }

    const entries = [...toEnqueue.values()].slice(0, RECONCILIATION_BATCH_SIZE);

    await Promise.allSettled(
        entries.map(({ resumeId, userId }) => limit(async () => {
            try {
                await enqueueResumeEmbeddingServiceV2(resumeId, userId);
                result.repaired++;
            } catch (err) {
                result.failed++;
                logger.error(`[RECONCILIATION] Failed enqueue resume: ${resumeId}`, err);
            }
        }))
    );

    return result;
}


// ── Pinecone vector gap-fill ──────────────────────────────────────────────────

async function reconcilePineconeVectors(dryRun: boolean, before: Date): Promise<ReconciliationResult> {
    const result: ReconciliationResult = { scanned: 0, repaired: 0, failed: 0, skipped: 0 };

    try {
        const index = getPineconeIndex();

        // Fetch existing vector IDs from both namespaces.
        // Pinecone list() returns IDs without fetching vectors — cheap operation.
        const [existingResumeIds, existingJobIds] = await Promise.all([
            fetchAllPineconeIds(index.namespace('resumes')),
            fetchAllPineconeIds(index.namespace('jobs')),
        ]);

        // Only consider embedding docs that existed before this reconciliation
        // run started. Docs written by workers we just enqueued will have
        // updatedAt >= before — their Pinecone upsert is handled by afterSave.
        const [allResumeEmbeddings, allJobEmbeddings] = await Promise.all([
            ResumeEmbedding
                .find({ updatedAt: { $lt: before } }, { resume: 1 })
                .limit(1000)
                .lean(),
            JobPostingEmbedding
                .find({ updatedAt: { $lt: before } }, { jobPosting: 1 })
                .limit(1000)
                .lean(),
        ]);

        const missingResumeVectors = allResumeEmbeddings.filter(
            e => !existingResumeIds.has(e.resume.toString())
        );
        const missingJobVectors = allJobEmbeddings.filter(
            e => !existingJobIds.has(e.jobPosting.toString())
        );

        result.scanned = missingResumeVectors.length + missingJobVectors.length;
        logger.info(
            `[RECONCILIATION] Pinecone gaps — resumes: ${missingResumeVectors.length} | ` +
            `jobs: ${missingJobVectors.length}`
        );

        if (dryRun) {
            result.skipped = result.scanned;
            return result;
        }

        const limit = pLimit(ENQUEUE_CONCURRENCY);

        // bypassThreshold=true — this is a repair operation, not a regular upsert.
        // We always want to fill gaps regardless of active job count.
        await Promise.allSettled(
            missingResumeVectors.map(e => limit(async () => {
                try {
                    await handleResumeVectorUpsert(e as any, null, true);
                    result.repaired++;
                } catch (err) {
                    result.failed++;
                    logger.error(`[RECONCILIATION] Pinecone resume upsert failed: ${e.resume}`, err);
                }
            }))
        );

        await Promise.allSettled(
            missingJobVectors.map(e => limit(async () => {
                try {
                    await handleJobVectorUpsert(e as any, true);
                    result.repaired++;
                } catch (err) {
                    result.failed++;
                    logger.error(`[RECONCILIATION] Pinecone job upsert failed: ${e.jobPosting}`, err);
                }
            }))
        );

    } catch (err) {
        logger.error('[RECONCILIATION] Pinecone gap-fill failed entirely', err);
    }

    return result;
}