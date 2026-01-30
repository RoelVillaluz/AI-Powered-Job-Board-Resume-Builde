import JobPosting from "../../models/jobPostings/jobPostingModel.js";
import { catchAsync } from "../../utils/errorUtils.js";
import { NotFoundError } from "../errorHandler.js";

export const checkIfJobExists = catchAsync(async (req, res, next) => {
    const { jobId } = req.params;

    const exists = await JobPosting.exists({ _id: jobId })

    if (!exists) {
        throw new NotFoundError('Job posting does not exist')
    }

    next();
})