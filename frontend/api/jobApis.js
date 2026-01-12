import axios from "axios";
import { BASE_API_URL } from "../src/config/api";
import { buildJobQueryParams } from "../src/utils/jobPostings/filters/buildJobQueryParams";

/**
 * Fetches a list of job postings based on provided filters, sorting, recommendations, and pagination.
 *
 * @param {Object} params - The parameters for fetching job postings.
 * @param {Object} params.filters - The filters to apply on the job postings.
 * @param {string} params.sortBy - The sorting criteria for the job postings (e.g., date, relevance).
 * @param {boolean} params.jobRecommendations - Job recommendations whose IDs will be excluded/merged with job postings to avoid duplication.
 * @param {string|null} [params.cursor=null] - The cursor for pagination, used for fetching the next set of job postings.
 * @param {number} [params.limit=20] - The number of job postings to fetch.
 * @returns {Promise<Object>} A promise that resolves to an object containing the job postings and pagination information.
 * @returns {Array} return.jobPostings - The array of job postings.
 * @returns {string|null} return.nextCursor - The cursor for the next set of job postings, or null if there are no more pages.
 * @returns {boolean} return.hasMore - Whether there are more job postings available.
 */
export const fetchJobPostings = async ({ 
    filters = {}, 
    sortBy, 
    jobRecommendations = [], 
    cursor = null, 
    limit = 20 
}) => {
    const queryString = buildJobQueryParams({
        filters,
        sortBy,
        jobRecommendations,
        cursor,
        limit,
    });

    // Use ? to append query string
    const { data } = await axios.get(`${BASE_API_URL}/job-postings?${queryString}`);
    
    return {
        jobPostings: data.data,
        nextCursor: data.pagination?.cursor ?? null,
        hasMore: data.pagination?.hasMore ?? false,
    };
}

/**
 * Fetches job recommendations for a specific user based on their profile.
 *
 * @param {string} userId - The ID of the user for whom to fetch job recommendations.
 * @returns {Promise<Array>} A promise that resolves to an array of recommended job postings.
 */
export const fetchJobRecommendations = async (userId) => {
    const { data } = await axios.get(
      `${BASE_API_URL}/ai/job-recommendations/${userId}`
    )
    return data.data
}

/**
 * Fetches the list of jobs a user has interacted with.
 *
 * @param {string} userId - The ID of the user whose interacted jobs to fetch.
 * @returns {Promise<Array>} A promise that resolves to an array of interacted job postings.
 */
export const fetchInteractedJobs = async (userId) => {
    const { data } = await axios.get(
      `${BASE_API_URL}/users/${userId}/interacted-jobs`
    )
    return data.data
}
