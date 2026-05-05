import { Request, Response } from "express";
import { catchAsync } from "../../utils/errorUtils.js";
import { enqueueResumeEmbeddingServiceV2, getResumeEmbeddingServiceV2 } from "../../services/resumes/resumeEmbeddingServiceV2.js";
import { sendResponse, STATUS_MESSAGES } from "../../constants.js";
import { prepareResumeEmbeddingFieldsRepo } from "../../repositories/resumes/resumeRepository.js";
import { ResumeEmbeddingsDocument } from "../../types/embeddings.types.js";

export const getResumeEmbeddingsControllerV2 = catchAsync(async (
    req: Request,
    res: Response
): Promise<void> => {
    const { resumeId } = req.params as { resumeId: string };

    const embeddings = await getResumeEmbeddingServiceV2(resumeId);

    if (!embeddings) {
        sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND }, "Resume Embeddings");
        return;
    }

    const data = embeddings as unknown as Record<string, unknown>;

    (sendResponse as any)(res, {
        ...STATUS_MESSAGES.SUCCESS.FETCH,
        data: embeddings,
    }, "Resume Embeddings");
});

export const generateResumeEmbeddingsControllerV2 = catchAsync(async (
    req: Request,
    res: Response
): Promise<void> => {
    const { resumeId } = req.params as { resumeId: string };
    const userId = req.user?.id?.toString();

    if (!userId) {
        sendResponse(res, { ...STATUS_MESSAGES.ERROR.UNAUTHORIZED });
        return;
    }

    const { jobId } = await enqueueResumeEmbeddingServiceV2(resumeId, userId);

    (sendResponse as any)(res, {
        ...STATUS_MESSAGES.SUCCESS.QUEUED,
        data: {
            jobId,
            statusUrl: `/api/jobs/${jobId}/status`,
        },
    }, "Resume Embeddings Generation Started");
});