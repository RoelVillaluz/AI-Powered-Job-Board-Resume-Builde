import { Request, Response } from "express";
import { catchAsync } from "../../utils/errorUtils.js";
import { sendResponse, STATUS_MESSAGES } from "../../constants.js";
import {
    enqueueMatchInsightService,
    getMatchInsightIfFresh,
} from "../../services/resumes/resumeMatchInsightService.js";

/**
 * GET — returns cached insight explanation if it exists and is fresh.
 * Returns 404 if no cached explanation or if it has been invalidated
 * by a re-ranking. The frontend uses this response to decide whether
 * to POST for generation.
 */
export const getMatchInsightController = catchAsync(async (req: Request, res: Response) => {
    const { resumeId, jobId } = req.params as { resumeId: string; jobId: string };

    const cached = await getMatchInsightIfFresh(resumeId, jobId);

    if (!cached) {
        sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND }, "Match Insight (cached)");
        return;
    }

    (sendResponse as any)(res, {
        ...STATUS_MESSAGES.SUCCESS.FETCH,
        data: cached,
    }, "Match Insight (cached)");
});

/**
 * POST — enqueues a Gemini insight generation job.  Always writes;
 * never checks for cached data.  The frontend calls GET first, and
 * only POSTs when GET returns 404 (no cached explanation).
 */
export const generateMatchInsightController = catchAsync(async (req: Request, res: Response) => {
    const { resumeId, jobId } = req.params as { resumeId: string; jobId: string };
    const userId = req.user?.id?.toString();

    if (!userId) {
        sendResponse(res, { ...STATUS_MESSAGES.ERROR.UNAUTHORIZED });
        return;
    }

    const result = await enqueueMatchInsightService(resumeId, jobId, userId);

    (sendResponse as any)(res, {
        ...STATUS_MESSAGES.SUCCESS.QUEUED,
        data: {
            jobId:     result.jobId,
            statusUrl: `/api/jobs/${result.jobId}/status`,
        },
    }, "Resume Match Insight Generation Started");
});