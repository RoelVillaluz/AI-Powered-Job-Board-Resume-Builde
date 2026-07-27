import { Request, Response } from "express";
import { catchAsync } from "../../utils/errorUtils.js";
import { sendResponse, STATUS_MESSAGES } from "../../constants.js";
import { enqueueMatchInsightService } from "../../services/resumes/resumeMatchInsightService.js";

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