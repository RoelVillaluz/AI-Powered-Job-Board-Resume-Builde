import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/errorUtils.js";
import { NotFoundError } from "../errorHandler.js";
import JobPosting from "../../models/jobPostings/jobPostingModel.js";

export const checkIfJobPostingExistsById = catchAsync(async (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    const { jobId } = req.params as { jobId: string };
    const jobPosting = await JobPosting.findById(jobId)
        .populate("company", "user")
        .lean();

    if (!jobPosting) throw new NotFoundError("Job posting");

    req.jobPostingDoc = jobPosting as any;
    next();
});

// Alias for the older JS route that imports by this name
export const checkIfJobExists = checkIfJobPostingExistsById;
