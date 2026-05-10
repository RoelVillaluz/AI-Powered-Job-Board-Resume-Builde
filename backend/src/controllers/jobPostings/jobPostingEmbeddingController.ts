import { Request, Response } from "express";

import { catchAsync } from "../../utils/errorUtils.js";

import {
    enqueueJobPostingEmbeddingService,
    getJobPostingEmbeddingService,
} from "../../services/jobPostings/jobPostingEmbeddingService.js";

import { sendResponse, STATUS_MESSAGES } from "../../constants.js";

export const getJobPostingEmbeddingsController = catchAsync(async (
    req: Request,
    res: Response
): Promise<void> => {

    const { jobPostingId } = req.params as {
        jobPostingId: string;
    };

    const embeddings = await getJobPostingEmbeddingService(jobPostingId);

    if (!embeddings) {
        sendResponse(
            res,
            { ...STATUS_MESSAGES.ERROR.NOT_FOUND },
            "Job Posting Embeddings"
        );
        return;
    }

    (sendResponse as any)(
        res,
        {
            ...STATUS_MESSAGES.SUCCESS.FETCH,
            data: embeddings,
        },
        "Job Posting Embeddings"
    );
});

export const generateJobPostingEmbeddingsController = catchAsync(async (
    req: Request,
    res: Response
): Promise<void> => {

    const { jobPostingId } = req.params as {
        jobPostingId: string;
    };

    const userId = req.user?.id?.toString();

    if (!userId) {
        sendResponse(
            res,
            { ...STATUS_MESSAGES.ERROR.UNAUTHORIZED }
        );
        return;
    }

    const { jobId } = await enqueueJobPostingEmbeddingService(
        jobPostingId
    );

    (sendResponse as any)(
        res,
        {
            ...STATUS_MESSAGES.SUCCESS.QUEUED,
            data: {
                jobId,
                statusUrl: `/api/jobs/${jobId}/status`,
            },
        },
        "Job Posting Embeddings Generation Started"
    );
});