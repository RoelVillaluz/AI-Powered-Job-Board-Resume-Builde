import JobPosting from "../../models/jobPostingModel.js";
import Company from "../../models/companyModel.js"

/**
 * Find job postings using cursor-based pagination
 * @param {Object} options
 * @param {string|null} options.cursor - ISO date string used as pagination cursor
 * @param {number} options.limit - Number of documents to fetch
 * @param {string[]} options.excludeIds - Job IDs to exclude
 * @returns {Promise<{ jobPostings: Array, hasMore: boolean, nextCursor: string|null }>}
 */
export const findJobsWithPagination = async ({ cursor, limit = 6, excludeIds = [] }) => {
    const query = {
        ...(cursor ? { postedAt: { $lt: new Date(cursor)} } : {}),
        ...(excludeIds.length > 0 ? { _id: { $nin: excludeIds } } : {})
    }

    const jobPostings = await JobPosting.find(query)
        .limit(limit)
        .populate('company', 'id name logo industry')
        .sort({ postedAt: -1, _id: -1 })
        .limit(limit + 1)
        .lean()

    const hasMore = jobPostings.length > limit;
    const items = hasMore ? jobPostings.slice(0, limit) : jobPostings;
    const nextCursor = hasMore ? items[items.length - 1].postedAt.toISOString() : null;

    return {
        jobPostings: items,
        hasMore,
        nextCursor
    }
}

/**
 * Find a job posting by ID with populated references
 * @param {string} id - Job posting ID
 * @returns {Promise<Object|null>}
 */
export const findJobById = async (id) => {
    return await JobPosting.findById(id)
        .populate('company', 'id name logo industry')
        .populate('applicants', 'profilePicture')
        .lean()    
}

/**
 * Create a new job posting
 * @param {Object} jobPostingData - Job posting data
 * @returns {Promise<Object>}
 */
export const createJob = async (jobPostingData) => {
    const newJob = new JobPosting(jobPostingData)
    return await newJob.save()
}

/**
 * Update a job posting by ID
 * @param {string} id - Job posting ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object|null>}
 */
export const updateJob = async (id, updateData) => {
    return await JobPosting.findByIdAndUpdate(
        id, updateData, 
        { new: true }
    ).lean();
}

/**
 * Delete a job posting by ID
 * @param {string} id - Job posting ID
 * @returns {Promise<Object|null>}
 */
export const deleteJob = async (id) => {
    return await JobPosting.findByIdAndDelete(id).lean();
}

/**
 * Add job posting to company's jobs list
 * @param {string} companyId - Company ID
 * @param {string} jobId - Job posting ID
 * @returns {Promise<Object|null>}
 */
export const addJobToCompany = async (companyId, jobId) => {
    return await Company.findByIdAndUpdate(
        companyId,
        { $push: { jobs: jobId } },
        { new: true }
    )
}

/**
 * Count total documents in collection
 * @returns {Promise<number>}
 */
export const count = async () => {
    return await JobPosting.countDocuments();
};