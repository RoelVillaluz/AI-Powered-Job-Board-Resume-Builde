import { Request, Response } from "express";
import { catchAsync } from "../../utils/errorUtils.js";
import { sendResponse, STATUS_MESSAGES } from "../../constants.js";
import * as ResumeJobMatchService from "../../services/resumes/resumeJobMatchService.js";

export const getResumeJobMatchController = catchAsync(async (req: Request, res: Response) => {
    const { resumeId } = req.params as { resumeId: string };

    const result = await ResumeJobMatchService.getMatchResultService(resumeId);

    if (!result) {
        sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND }, "Resume Job Matches");
        return;
    }

    (sendResponse as any)(res, {
        ...STATUS_MESSAGES.SUCCESS.FETCH,
        data: result,
    }, "Resume Job Matches");
})

export const generateResumeJobMatchController = catchAsync(async (req: Request, res: Response) => {
    const { resumeId } = req.params as { resumeId: string };
    const userId = req.user?.id?.toString();

    if (!userId) {
        sendResponse(res, { ...STATUS_MESSAGES.ERROR.UNAUTHORIZED });
        return;
    }

    const result = await ResumeJobMatchService.enqueueMatchingService(
        resumeId,
        userId,
    );

    (sendResponse as any)(res, {
        ...STATUS_MESSAGES.SUCCESS.QUEUED,
        data: {
            jobId:     result.jobId,
            statusUrl: `/api/jobs/${result.jobId}/status`,
        },
    }, "Resume Job Match Started");
})