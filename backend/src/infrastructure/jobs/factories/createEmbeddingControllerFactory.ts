import { Request, Response } from 'express';
import { Types }             from 'mongoose';
import { catchAsync }        from '../../../utils/errorUtils.js';
import { sendResponse, STATUS_MESSAGES } from '../../../constants.js';

interface EmbeddingControllerConfig {
    label:          string;
    getEmbedding:   (id: Types.ObjectId) => Promise<{ cached: boolean; data: any } | any | null>;
    enqueue:        (id: Types.ObjectId) => Promise<{ jobId: string }>;
}

export const createEmbeddingControllerFactory = (config: EmbeddingControllerConfig) => {
    const { label, getEmbedding, enqueue } = config;

    // GET /:id/embeddings
    // Returns stored embedding or 404. Client calls POST on 404.
    const getEmbeddingController = catchAsync(async (req: Request, res: Response) => {
        const { id } = req.params as { id: string };

        const result = await getEmbedding(new Types.ObjectId(id));
        const data = result?.cached ? result.data : result;

        if (!data) {
            (sendResponse as any)(res, {
                ...STATUS_MESSAGES.ERROR.NOT_FOUND,
            }, label);
            return;
        }

        (sendResponse as any)(res, {
            ...STATUS_MESSAGES.SUCCESS.FETCH,
            data,
            cached: true,
        }, label);
    });

    // POST /:id/embeddings
    // Always enqueues generation. Returns jobId immediately.
    const generateEmbeddingController = catchAsync(async (req: Request, res: Response) => {
        const { id } = req.params as { id: string };

        const { jobId } = await enqueue(new Types.ObjectId(id));

        (sendResponse as any)(res, {
            ...STATUS_MESSAGES.SUCCESS.QUEUED,
            data: {
                jobId,
                statusUrl: `/api/jobs/${jobId}/status`,
            },
        }, label);
    })

    return {
        getEmbeddingController,
        generateEmbeddingController,
    };
}