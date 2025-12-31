import { catchAsync } from "../../utils/errorUtils.js";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "../errorHandler.js";
import JobPosting from "../../models/jobPostingModel.js";

export const authorizeJobPosting = catchAsync(async (req, res, next) => {
    const { id } = req.params; // Match your route parameter
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
        throw new UnauthorizedError('Invalid authentication data');
    }

    const jobPosting = await JobPosting.findById(id)
        .populate({
            path: 'company',
            populate: {
                path: 'user',
                select: '_id'
            }
        });

    if (!jobPosting) {
        throw new NotFoundError('Job Posting');
    }

    // Ensure company and user exist before comparing
    if (!jobPosting.company?.user?._id) {
        throw new ForbiddenError('Job posting has invalid company data');
    }

    if (userId.toString() !== jobPosting.company.user._id.toString()) {
        throw new ForbiddenError('You are not authorized to modify this job posting');
    }

    // Attach jobPosting to request for potential reuse
    req.jobPosting = jobPosting;
    
    next(); // Call next() to proceed to the next middleware
});