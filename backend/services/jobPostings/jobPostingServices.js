import mongoose from "mongoose";
import * as JobPostingRepository from "../../repositories/jobPostings/jobPostingRepositories.js";
import { transformProfilePictureUrl } from "../transformers/urlTransformers.js";
import JobPosting from "../../models/jobPostingModel.js";

/**
 * Get paginated job postings with metadata
 * @param {Object} options - Query options
 * @returns {Promise<Object>}
 */
export const getJobPostings = async ({ skip, limit, excludeIds }) => {
    const { jobPostings, total } = await JobPostingRepository.findJobsWithPagination({
        skip,
        limit,
        excludeIds
    })

    const hasMore = (skip + jobPostings.length) < total;

    return {
        jobPostings,
        total,
        hasMore
    };
}

/**
 * Get a single job posting with normalized applicant data
 * @param {string} id - Job posting ID
 * @returns {Promise<Object|null>}
 */
export const getJobPosting = async (id) => {
    const jobPosting = await JobPostingRepository.findJobById(id)

    // Normalize applicant profile pictures
    if (jobPosting.applicants && jobPosting.applicants.length > 0) {
        jobPosting.applicants = jobPosting.applicants.map(applicant => ({
            ...applicant,
            profilePicture: transformProfilePictureUrl(applicant.profilePicture)
        }));
    }

    return jobPosting;
}

/**
 * Create a new job posting and associate with company
 * @param {Object} jobPostingData - Job posting data
 * @returns {Promise<Object>}
 */
export const createJobPosting = async (jobPostingData) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const newJob = await JobPostingRepository.createJob(
            jobPostingData,
            { session }
        )

        await JobPostingRepository.addJobToCompany(
            jobPostingData.company,
            newJob._id,
            { session }
        )

        await session.commitTransaction()
        return newJob
    } catch (error) {
        await session.abortTransaction();
        throw error
    } finally {
        session.endSession();
    }
}

/**
 * Update an existing job posting
 * @param {string} id - Job posting ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object|null>}
 */
export const updateJobPosting = async (id, updateData) => {
    return await JobPostingRepository.updateJobPosting(id, updateData)
}

/**
 * Delete a job posting
 * @param {string} id - Job posting ID
 * @returns {Promise<boolean>}
 */
export const deleteJobPosting = async (id) => {
    const deleted = await JobPostingRepository.deleteById(id);
    return !!deleted;
};