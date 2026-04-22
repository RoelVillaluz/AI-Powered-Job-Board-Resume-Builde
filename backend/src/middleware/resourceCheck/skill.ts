import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/errorUtils.js";
import Skill from "../../models/market/skillModel.js";
import { NotFoundError } from "../errorHandler.js";

export const checkIfSkillExistsById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params as { id: string };

    const exists = await Skill.exists({ _id: id });

    if (!exists) {
        throw new NotFoundError('Skill')
    }

    next();
})