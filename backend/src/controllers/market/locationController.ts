import { catchAsync } from "../../utils/errorUtils.js";
import { Request, Response } from "express";
import * as LocationRepo from '../../repositories/market/locationRepositories.js'
import * as LocationService from '../../services/market/locationService.js'
import { Types } from "mongoose";
import { STATUS_MESSAGES } from "../../constants.js";
import { sendTypedResponse } from "../../utils/sendTypedResponse.js";
import { CreateLocationPayload, LocationEmbeddingData, LocationInterface, UpdateLocationPayload } from "../../types/location.types.js";
import { ApiQueueResponse } from "../../types/apiResponse.types.js";

export const getLocationByIdController = catchAsync(async(req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const location = await LocationRepo.getLocationByIdRepository(new Types.ObjectId(id));

    return sendTypedResponse<LocationInterface | null>(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: location }, 'Location')
})

export const getLocationsBName = catchAsync(async (req: Request, res: Response) => {
    const { name } = req.params as { name: string };

    const location = await LocationRepo.getLocationByNameRepository(name);

    return sendTypedResponse<LocationInterface | null>(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: location }, 'Location')
})

export const searchLocationsByName = catchAsync(async (req: Request, res: Response) => {
    const { name } = req.params as { name: string };

    const locations = await LocationRepo.searchLocationsByNameRepository(name);

    return sendTypedResponse<LocationInterface[]>(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: locations }, 'Location')
})

export const getLocationEmbeddingsById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { invalidateCache } = req.body

    const result = await LocationService.getOrGenerateLocationEmbeddingService(
        new Types.ObjectId(id),
        invalidateCache
    )
    
    if (result.cached) {
        return sendTypedResponse<LocationEmbeddingData>(
            res,
            {
                ...STATUS_MESSAGES.SUCCESS.FETCH,
                data: result.data
            }, 'Location Embeddings')
    }

    return res.status(201).json({
        success: true,
        cached: false,
        message: 'Embedding generation queued',
        jobId: result.jobId,
        statusUrl: `/api/jobs/${result.jobId}/status`
    } as ApiQueueResponse)
})

export const createLocation = catchAsync(async (req: Request, res: Response) => {
    const { data } = req.body as { data: CreateLocationPayload };

    const newLocation = await LocationService.createLocationService(data);

    return sendTypedResponse(res, { ...STATUS_MESSAGES.SUCCESS.CREATE, data: newLocation }, 'Location')
})

export const updateLocation = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { data } = req.body as { data: UpdateLocationPayload };

    const newLocation = await LocationService.updateLocationService(new Types.ObjectId(id), data);

    return sendTypedResponse(res, { ...STATUS_MESSAGES.SUCCESS.UPDATE, data: newLocation }, 'Location')
})