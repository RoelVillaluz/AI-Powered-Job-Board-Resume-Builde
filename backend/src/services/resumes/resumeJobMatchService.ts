import { Types }    from "mongoose";
import logger       from "../../utils/logger.js";
import { QueueJob } from "../../types/queues.types.js";
import { EmitFn }   from "../../infrastructure/jobs/core/computeRegistryTypesV2.js";
import { executeComputePipelineV2 } from "../../infrastructure/jobs/core/executeComputePipelineV2.js";
import {
    getMatchResultRepo,
    getSingleJobMatchRepo,
} from "../../repositories/resumes/resumeJobMatchRepository.js";

import {
    matchingRequestsTotal,
    matchingDurationSeconds,
    matchScoreDistribution,
} from '../../config/metrics.js';

const MATCH_TTL_DAYS = 1;

/**
 * Returns cached match result if fresh (< 1 day old).
 * Matches stale faster than resume scores — job market changes daily.
 */
export const getMatchResultService = async (
    resumeId: string | Types.ObjectId,
) => {
    const result = await getMatchResultRepo(resumeId);
    if (!result) return null;

    const daysSince =
        (Date.now() - new Date(result.rankedAt).getTime()) /
        (1000 * 60 * 60 * 24);

    if (daysSince < MATCH_TTL_DAYS) {
        logger.info(`[Matching] Cache hit: ${resumeId}`);
        return result;
    }

    logger.info(`[Matching] Cache stale: ${resumeId}`);
    return null;
};

/**
 * Returns the match breakdown for a single job from the resume's match list.
 *
 * Replaces legacy: ResumeJobComparison.findOne({ resume, jobPosting })
 * Used by job details page to show qualification breakdown without recomputing.
 */
export const getSingleJobMatchService = async (
    resumeId:     string | Types.ObjectId,
    jobPostingId: string | Types.ObjectId,
) => {
    const match = await getSingleJobMatchRepo(resumeId, jobPostingId);

    if (!match) {
        logger.info(`[Matching] No match entry found for job: ${jobPostingId} in resume: ${resumeId}`);
        return null;
    }

    return match;
};

/**
 * Enqueues a resume-job matching job.
 * Called after resume embedding completes (via afterSave hook)
 * or when user explicitly requests fresh matches.
 */
export const enqueueMatchingService = async (
    resumeId: string,
    userId:   string,
): Promise<{ jobId: string }> => {
    const { matchingRegistry } = await import(
        '../../infrastructure/jobs/domains/matching/matchingRegistry.js'
    );
    return matchingRegistry.resumeJobMatch.queue({
        id: resumeId,
        resumeId,
        userId,
    });
};

/**
 * Executes the full matching pipeline directly (outside queue).
 * Used by the worker — not called from services directly.
 */
export const upsertMatchingService = async (
    resumeId: string | Types.ObjectId,
    job:      QueueJob | null = null,
    emit?:    EmitFn,
) => {
    const end = matchingDurationSeconds.startTimer({ used_pinecone: 'unknown' });

    try {
        const { matchingRegistry } = await import(
        '../../infrastructure/jobs/domains/matching/matchingRegistry.js'
    );
    const result = await executeComputePipelineV2({
        config: matchingRegistry.resumeJobMatch,
        id:     resumeId,
        job,
        emit,
    });

    // ── Prometheus ────────────────────────────────────────────────────
    const usedPinecone = result.data?.usedPinecone ? 'true' : 'false';
    matchingRequestsTotal.inc({ status: 'success', used_pinecone: usedPinecone });

    end({ used_pinecone: usedPinecone });

    // Record score distribution for each match result
    for (const match of result.data?.matches ?? []) {
        matchScoreDistribution.observe(
            { recommendation_type: match.recommendationType ?? 'Unknown' },
            match.finalScore ?? 0,
        );
    }

    return result;
    
    } catch (error) {
        matchingRequestsTotal.inc({ status: 'failed', used_pinecone: 'unknown' });
        end({ used_pinecone: 'unknown' });
        throw error;
    }
};