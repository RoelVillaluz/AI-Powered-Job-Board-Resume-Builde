import { Types } from "mongoose";
import { catchAsync } from "../../utils/errorUtils";
import { Request, Response, NextFunction } from "express";
import JobTitle from "../../models/market/jobTitleModel";
import { NotFoundError } from "../errorHandler";

export const checkIfJobTitleExistsById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };
    
    const exists = await JobTitle.exists({ _id: id });

    if (!exists) {
        throw new NotFoundError('Job Title')
    }

    next();
})

export const checkIfJobTitleExistsByName = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { title } = req.params as { title: string };
    
    const exists = await JobTitle.exists({ title: title });

    if (!exists) {
        throw new NotFoundError('Job Title')
    }

    next();
})