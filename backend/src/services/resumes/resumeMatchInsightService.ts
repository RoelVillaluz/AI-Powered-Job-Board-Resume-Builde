import { Types } from "mongoose";
import logger     from "../../utils/logger.js";

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