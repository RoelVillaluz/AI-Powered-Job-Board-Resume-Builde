import JobPosting from "../../models/jobPostingModel.js";
import { catchAsync } from "../../utils/errorUtils.js";
import { NotFoundError } from "../errorHandler.js";

export const checkIfJobExists = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const exists = await JobPosting.exists({ _id: id })

    if (!exists) {
        throw new NotFoundError('Job posting does not exist')
    }

    next();
})