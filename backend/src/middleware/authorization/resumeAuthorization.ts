import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/errorUtils.js";
import { ForbiddenError } from "../errorHandler.js";

export const enforceResumeOwnership = catchAsync(
    async (req: Request, _res: Response, next: NextFunction) => {
        const resume = req.resumeDoc;

        if (!resume) throw new Error("Resume must exist before ownership check");

        if (!req.user) throw new Error("User must be authenticated before ownership check");
        if (resume.user.toString() !== req.user.id.toString()) {
            throw new ForbiddenError("You do not have access to this resume");
        }

        next();
    }
);