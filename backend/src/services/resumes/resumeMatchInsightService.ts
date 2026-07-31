import { Types } from "mongoose";
import logger     from "../../utils/logger.js";
import { getSingleMatchWithRankedAtRepo } from "../../repositories/resumes/resumeJobMatchRepository.js";

/**
 * Returns the cached insight explanation if it exists and is still fresh
 * relative to the match's last ranking.
 * If the explanation is missing, stale, or no match document exists → null.
 */
export const getMatchInsightIfFresh = async (
    resumeId: string,
    jobId:    string,
): Promise<{ explanation: string; generatedAt: Date } | null> => {
    const doc = await getSingleMatchWithRankedAtRepo(resumeId, jobId);

    const match = (doc as any)?.matches?.[0];
    if (!match?.explanation || !match?.explanationGeneratedAt) return null;

    const rankedAt = (doc as any)?.rankedAt;
    if (!rankedAt) return null;

    if (new Date(match.explanationGeneratedAt) >= new Date(rankedAt)) {
        return { explanation: match.explanation, generatedAt: match.explanationGeneratedAt };
    }

    return null;
};

/**
 * Enqueues generation of a RAG-based fit explanation for one resume/job match.
 * Called when the user visits the job comparison page.
 */
export const enqueueMatchInsightService = async (
    resumeId: string,
    jobId:    string,
    userId:   string,
): Promise<{ jobId: string }> => {
    const { resumeMatchInsightRegistry } = await import(
        '../../infrastructure/jobs/domains/matching/matchInsightRegistry.js'
    );
    const { pushPendingInsight } = await import(
        '../../infrastructure/jobs/domains/matching/pendingInsightStore.js'
    );

    await pushPendingInsight(resumeId, { jobId });

    return resumeMatchInsightRegistry.resumeMatchInsight.queue({
        id: resumeId,
        resumeId,
        jobId,
        userId,
    });
};