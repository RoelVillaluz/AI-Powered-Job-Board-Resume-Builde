import JobPosting from '../../models/jobPostings/jobPostingModel.js';
import logger from '../../utils/logger.js';

/**
 * Minimum number of ACTIVE job postings required before Pinecone vector
 * search is used. Below this threshold, a standard MongoDB query is used
 * instead — it's faster, cheaper, and just as accurate on small datasets.
 *
 * Rationale:
 * - Pinecone charges per query (read units). On small datasets the cost
 *   is wasteful and latency is higher than a simple MongoDB filter.
 * - Vector search adds value when the candidate pool is large enough that
 *   semantic ranking meaningfully re-orders results. Below ~500 jobs,
 *   keyword + filter matching is equally effective.
 *
 * Tune this value based on your actual job posting volume.
 */
const PINECONE_JOB_THRESHOLD = 500;


/**
 * TTL cache — recount at most once every 5 minutes.
 * Avoids a MongoDB COUNT on every single embedding save.
 */
let cachedCount: number | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;


/**
 * Returns true if the system should use Pinecone for job matching.
 * Returns false if the dataset is too small — fall back to MongoDB.
 *
 * @example
 * const use = await shouldUsePinecone();
 * if (!use) return fallbackMongoQuery(resumeId);
 */
export const shouldUsePinecone = async (): Promise<boolean> => {
    const now = Date.now();

    if (cachedCount !== null && now < cacheExpiresAt) {
        return cachedCount >= PINECONE_JOB_THRESHOLD
    }

    try {
        cachedCount = await JobPosting.countDocuments({ status: 'Active' });
        cacheExpiresAt = now + CACHE_TTL_MS;

        logger.info(`[Pinecone Threshold] Active jobs: ${cachedCount} | threshold: ${PINECONE_JOB_THRESHOLD} | use Pinecone: ${cachedCount >= PINECONE_JOB_THRESHOLD}`);

        return cachedCount >= PINECONE_JOB_THRESHOLD;

    } catch (err) {
        // If count fails, default to NOT using Pinecone — safe fallback
        logger.error('[Pinecone Threshold] Count failed — defaulting to MongoDB fallback', err);
        return false;
    }
}

/** Invalidate cache manually — call after bulk job imports */
export const invalidatePineconeThresholdCache = (): void => {
    cachedCount = null;
    cacheExpiresAt = 0;
}