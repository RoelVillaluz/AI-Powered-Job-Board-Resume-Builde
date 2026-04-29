import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/errorUtils.js";
import { NotFoundError } from "../errorHandler.js";
import { findResumeByIdLiteRepo } from "../../repositories/resumes/resumeRepository.js";

export const checkIfResumeExistsById = catchAsync(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { resumeId } = req.params as { resumeId: string };
    const resume = await findResumeByIdLiteRepo(resumeId);

    if (!resume) throw new NotFoundError('Resume');

    req.resumeDoc = resume as any;
    next();
});