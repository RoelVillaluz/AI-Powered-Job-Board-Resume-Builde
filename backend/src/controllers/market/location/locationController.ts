import { catchAsync } from "../../../utils/errorUtils.js";
import { Request, Response } from "express";
import * as LocationRepo from '../../../repositories/market/locationRepositories.js'
import * as LocationServiceV2 from '../../../services/market/locationServiceV2.js'
import { Types } from "mongoose";
import { STATUS_MESSAGES } from "../../../constants.js";
import { sendTypedResponse } from "../../../utils/sendTypedResponse.js";
import { CreateLocationPayload, LocationInterface, UpdateLocationPayload } from "../../../types/location.types.js";

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

export const createLocation = catchAsync(async (req: Request, res: Response) => {
    const { data } = req.body as { data: CreateLocationPayload };

    const newLocation = await LocationServiceV2.createLocationServiceV2(data);

    return sendTypedResponse(res, { ...STATUS_MESSAGES.SUCCESS.CREATE, data: newLocation }, 'Location')
})

export const updateLocation = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { data } = req.body as { data: UpdateLocationPayload };

    const newLocation = await LocationServiceV2.updateLocationServiceV2(new Types.ObjectId(id), data);

    return sendTypedResponse(res, { ...STATUS_MESSAGES.SUCCESS.UPDATE, data: newLocation }, 'Location')
})