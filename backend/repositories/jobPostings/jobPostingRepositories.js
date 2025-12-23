import JobPosting from "../../models/jobPostingModel.js";
import Company from "../../models/companyModel.js"

/**
 * Find job postings with pagination and exclusion filters
 * @param {Object} options - Query options
 * @param {number} options.skip - Number of documents to skip
 * @param {number} options.limit - Maximum number of documents to return
 * @param {string[]} options.excludeIds - Array of IDs to exclude
 * @returns {Promise<{jobPostings: Array, total: number}>}
 */
export const findJobsWithPagination = async ({ skip = 0, limit = 6, excludeIds = [] }) => {
    const query = excludeIds.length > 0
        ? { _id: { $nin: excludeIds }}
        : {};

    const [jobPostings, totalJobs] = await Promise.all([
        JobPosting.find(query)
            .populate("company", "id name logo industry")
            .skip(skip)
            .limit(limit)
            .lean(),
        JobPosting.countDocuments(query)
    ]);

    return { jobPostings, total: totalJobs };
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