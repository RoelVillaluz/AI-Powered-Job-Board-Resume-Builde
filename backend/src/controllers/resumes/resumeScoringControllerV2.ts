import { Request, Response } from "express";
import { catchAsync } from "../../utils/errorUtils.js";
import { sendResponse, STATUS_MESSAGES } from "../../constants.js";
import * as ResumeScoreServiceV2 from '../../services/resumes/resumeScoreServiceV2.js'

export const getResumeScoreControllerV2 = catchAsync(async (
    req: Request,
    res: Response
): Promise<void> => {
    const { resumeId } = req.params as { resumeId: string };

    const score = await ResumeScoreServiceV2.getResumeScoreServiceV2(resumeId);

    if (!score) {
        sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND }, 'Resume Score');
        return;
    }

    (sendResponse as any)(res, {
        ...STATUS_MESSAGES.SUCCESS.FETCH,
        data: score,
    }, 'Resume Score')
});

export const generateResumeScoreControllerV2 = catchAsync(async (
    req: Request,
    res: Response
): Promise<void> => {
    const { resumeId } = req.params as { resumeId: string };
    const userId = req.user?.id?.toString();

    if (!userId) {
        sendResponse(res, { ...STATUS_MESSAGES.ERROR.UNAUTHORIZED });
        return;
    }

    const result = await ResumeScoreServiceV2.enqueueResumeScoreServiceV2(resumeId, userId);

    if (!('jobId' in result)) {
        (sendResponse as any)(res, {
            code:    202,
            message: 'Embeddings required before scoring',
            data:    { status: 'embeddings_required' },
        }, 'Resume Score');
        return;
    }

    (sendResponse as any)(res, {
        ...STATUS_MESSAGES.SUCCESS.QUEUED,
        data: {
            jobId:     result.jobId,
            statusUrl: `/api/jobs/${result.jobId}/status`,
        },
    }, 'Resume Score Generation Started');
});