import { catchAsync } from "../../utils/errorUtils.js";
import { Request, Response } from "express";
import Industry from "../../models/market/industryModel.js";
import { IndustryInterface, IndustryEmbeddingData, CreateIndustryPayload, UpdateIndustryPayload } from "../../types/industry.types.js";
import { Types } from "mongoose";
import { ApiQueueResponse } from "../../types/apiResponse.types.js";
import { STATUS_MESSAGES } from "../../constants.js";
import * as IndustryRepo from '../../repositories/market/industryRepositories';
import * as IndustryService from '../../services/market/industryService';
import { sendTypedResponse } from "../../utils/sendTypedResponse.js";

export const getIndustryById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const industry = await IndustryRepo.getIndustryByIdRepository(new Types.ObjectId(id));

    return sendTypedResponse<IndustryInterface | null>(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: industry }, 'Industry');
});

export const getIndustryByName = catchAsync(async (req: Request, res: Response) => {
    const { name } = req.params as { name: string };

    const industry = await IndustryRepo.getIndustryByNameRepository(name);

    return sendTypedResponse<IndustryInterface | null>(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: industry }, 'Industry');
});

export const getAllIndustries = catchAsync(async (req: Request, res: Response) => {
    const industries = await IndustryRepo.getAllIndustriesRepository();

    return sendTypedResponse<IndustryInterface[]>(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: industries }, 'Industry');
});

export const getIndustryEmbeddingsById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { invalidateCache } = req.body;

    const result = await IndustryService.getOrGenerateIndustryEmbeddingService(
        new Types.ObjectId(id),
        invalidateCache
    );

    if (result.cached) {
        return sendTypedResponse<IndustryEmbeddingData>(
            res,
            {
                ...STATUS_MESSAGES.SUCCESS.FETCH,
                data: result.data
            },
            'Industry Embeddings'
        );
    }

    return res.status(201).json({
        success: true,
        cached: false,
        message: 'Embedding generation queued',
        jobId: result.jobId,
        statusUrl: `/api/jobs/${result.jobId}/status`
    } as ApiQueueResponse);
});

export const createIndustry = catchAsync(async (req: Request, res: Response) => {
    const { data } = req.body as { data: CreateIndustryPayload };

    const newIndustry = await IndustryService.createIndustryService(data);

    return sendTypedResponse<IndustryInterface>(res, { ...STATUS_MESSAGES.SUCCESS.CREATE, data: newIndustry }, 'Industry');
});

export const updateIndustry = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { data } = req.body as { data: UpdateIndustryPayload };

    const updatedIndustry = await IndustryService.updateIndustryService(new Types.ObjectId(id), data);

    return sendTypedResponse<IndustryInterface | null>(res, { ...STATUS_MESSAGES.SUCCESS.UPDATE, data: updatedIndustry }, 'Industry');
});

export const deleteIndustry = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    await IndustryRepo.deleteIndustryRepository(new Types.ObjectId(id));

    return sendTypedResponse<null>(res, { ...STATUS_MESSAGES.SUCCESS.DELETE, data: null }, 'Industry');
});