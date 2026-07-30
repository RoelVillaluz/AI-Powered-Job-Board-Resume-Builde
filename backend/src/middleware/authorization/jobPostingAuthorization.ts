import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/errorUtils.js";
import { ForbiddenError, NotFoundError } from "../errorHandler.js";

export const enforceJobPostingOwnership = catchAsync(
    async (req: Request, _res: Response, next: NextFunction) => {
        const jobPosting = req.jobPostingDoc as any;

        if (!jobPosting) throw new Error("Job posting must exist before ownership check");
        if (!req.user) throw new Error("User must be authenticated before ownership check");

        if (!jobPosting.company || !jobPosting.company.user) {
            throw new NotFoundError("Company");
        }

        if (jobPosting.company.user.toString() !== req.user.id.toString()) {
            throw new ForbiddenError("You do not have access to this job posting");
        }

        next();
    }
);
