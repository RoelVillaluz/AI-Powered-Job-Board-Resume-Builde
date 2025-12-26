import mongoose from "mongoose";
import * as JobPostingRepository from "../../repositories/jobPostings/jobPostingRepositories.js";
import { transformProfilePictureUrl } from "../transformers/urlTransformers.js";
import { parseFilterParams } from "../../../frontend/src/utils/jobPostings/filterJobUtils.js";
import JobPosting from "../../models/jobPostingModel.js";

/**
 * Get filtered, sorted, and paginated job postings (cursor-based)
 * @param {Object} queryParams - Raw query parameters from request
 * @param {Object} options - Additional options
 * @param {boolean} options.includeTotal - Whether to include total count (expensive operation)
 * @returns {Promise<Object>}
 */
export const getJobPostings = async (queryParams, options = {}) => {
    // Parse and validate filters
    const parsedFilters = parseFilterParams(queryParams);

    const { cursor, limit, excludeIds, sortBy, ...filters } = parsedFilters;

    // Fetch jobs from repository with cursor-based pagination
    const { jobPostings, nextCursor, hasMore } = await JobPostingRepository.findJobsWithFilters({
        filters,
        cursor,
        limit,
        excludeIds,
        sortBy
    });

    const result = {
        jobPostings,
        nextCursor,
        hasMore,
        count: jobPostings.length
    };

    // Optionally include total count (expensive, only when explicitly requested)
    // Use case: "Showing 20 of 1,234 results"
    if (options.includeTotal) {
        const total = await JobPostingRepository.countJobsWithFilters(filters);
        result.total = total;
    }

    return result;
};

/**
 * Get a single job posting with normalized applicant data
 * @param {string} id - Job posting ID
 * @returns {Promise<Object|null>}
 */
export const getJobPosting = async (id) => {
    const jobPosting = await JobPostingRepository.findJobById(id);
    
    if (!jobPosting) {
        return null;
    }

    return jobPosting;
};

/**
 * Get job applicants (for employers/admins only)
 * @param {string} id - Job posting ID
 * @returns {Promise<Array>}
 */
export const getJobApplicants = async (id) => {
    const applicants = await JobPostingRepository.findJobApplicants(id);

    // Normalize profile pictures
    return applicants.map(applicant => ({
        ...applicant,
        profilePicture: transformProfilePictureUrl(applicant.profilePicture)
    }));
};

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
        );

        await JobPostingRepository.addJobToCompany(
            jobPostingData.company,
            newJob._id,
            { session }
        );

        await session.commitTransaction();
        
        // TODO: Invalidate Redis cache if implemented
        // await invalidateJobCache(newJob);
        
        return newJob;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Update an existing job posting
 * @param {string} id - Job posting ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object|null>}
 */
export const updateJobPosting = async (id, updateData) => {
    const updatedJob = await JobPostingRepository.updateJob(id, updateData);
    
    // TODO: Invalidate specific cache entries
    // await redis.del(`jobs:${id}`);
    
    return updatedJob;
};

/**
 * Delete a job posting
 * @param {string} id - Job posting ID
 * @returns {Promise<boolean>}
 */
export const deleteJobPosting = async (id) => {
    const deleted = await JobPostingRepository.deleteJob(id);
    
    // TODO: Invalidate cache
    // await invalidateJobCache();
    
    return !!deleted;
};