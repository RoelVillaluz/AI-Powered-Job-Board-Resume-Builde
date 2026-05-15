import { Request, Response } from "express";
import { catchAsync }        from "../../utils/errorUtils.js";
import { sendResponse, STATUS_MESSAGES } from "../../constants.js";
import * as ResumeSalaryPredictionService from "../../services/resumes/resumeSalaryPredictionService.js";


export const getResumeSalaryPredictionController = catchAsync(async (
    req: Request,
    res: Response,
): Promise<void> => {
    const { resumeId } = req.params as { resumeId: string };

    const prediction = await ResumeSalaryPredictionService.getResumeSalaryPredictionService(resumeId);

    if (!prediction) {
        sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND }, "Resume Salary Prediction");
        return;
    }

    (sendResponse as any)(res, {
        ...STATUS_MESSAGES.SUCCESS.FETCH,
        data: prediction,
    }, "Resume Salary Prediction");
});


export const generateResumeSalaryPredictionController = catchAsync(async (
    req: Request,
    res: Response,
): Promise<void> => {
    const { resumeId } = req.params as { resumeId: string };
    const userId = req.user?.id?.toString();

    if (!userId) {
        sendResponse(res, { ...STATUS_MESSAGES.ERROR.UNAUTHORIZED });
        return;
    }

    const result = await ResumeSalaryPredictionService.enqueueResumeSalaryPredictionService(
        resumeId,
        userId,
    );

    (sendResponse as any)(res, {
        ...STATUS_MESSAGES.SUCCESS.QUEUED,
        data: {
            jobId:     result.jobId,
            statusUrl: `/api/jobs/${result.jobId}/status`,
        },
    }, "Resume Salary Prediction Started");
});