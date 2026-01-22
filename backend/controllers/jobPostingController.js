import JobPosting from "../models/jobPostings/jobPostingModel.js"
import * as JobPostingService from "../services/jobPostings/jobPostingServices.js";
import { checkMissingFields } from '../utils.js'
import { STATUS_MESSAGES, sendResponse } from '../constants.js';
import { catchAsync } from "../utils/errorUtils.js";
import User from "../models/userModel.js";

/**
 * Get filtered, sorted, and paginated list of job postings
 * Uses cursor-based pagination for optimal performance
 * 
 * @route GET /api/job-postings
 * 
 * @queryparam {string} cursor - Cursor for pagination (base64 encoded)
 * @queryparam {number} limit - Max jobs per page (default: 20, max: 100)
 * @queryparam {string} exclude - Comma-separated job IDs to exclude
 * @queryparam {string} sortBy - Sort type (A-Z, Z-A, Newest First, Highest Salary, Best Match)
 * @queryparam {number} minSalary - Minimum salary filter
 * @queryparam {number} maxSalary - Maximum salary filter
 * @queryparam {string} jobType - Comma-separated job types (Full-Time, Part-Time, etc.)
 * @queryparam {string} experienceLevel - Comma-separated experience levels
 * @queryparam {string} skills - Comma-separated skills
 * @queryparam {string} industry - Comma-separated industries
 * @queryparam {string} jobTitle - Job title search query
 * @queryparam {string} location - Location search query
 * @queryparam {boolean} hasQuestions - Filter jobs with pre-screening questions
 * @queryparam {string} datePosted - Date filter (today, this_week, this_month, last_3_months)
 * @queryparam {boolean} includeTotal - Include total count in response (expensive, default: false)
 * 
 * @example
 * GET /api/job-postings?jobType=Full-Time&location=NYC&sortBy=Newest First&limit=20
 * GET /api/job-postings?cursor=MjAyNC0wMS0xNVQxMDozMDowMC4wMDBafDUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMQ==&limit=20
 */
export const getJobPostings = catchAsync(async (req, res) => {
    // Validate and sanitize limit
    let limit = parseInt(req.query.limit) || 20;
    if (limit > 100) limit = 100; // Prevent abuse
    if (limit < 1) limit = 20;
    
    // Include total count only if explicitly requested
    const includeTotal = req.query.includeTotal === 'true';
    
    // Pass entire query object to service
    const result = await JobPostingService.getJobPostings(req.query, { includeTotal });

    return res.status(200).json({
        success: true,
        message: 'Job postings fetched successfully',
        data: result.jobPostings,
        pagination: {
            cursor: result.nextCursor,
            hasMore: result.hasMore,
            count: result.count,
            ...(includeTotal && { total: result.total })
        }
    });
});

/**
 * Get single job posting by ID
 * @route GET /api/job-postings/:id
 */
export const getJobPosting = catchAsync(async (req, res) => {
    const { id } = req.params;

    const jobPosting = await JobPostingService.getJobPosting(id)

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: jobPosting }, 'Job posting')
})


/**
 * Creates job posting
 * @route POST /api/job/postings
 */
export const createJobPosting = catchAsync(async (req, res) => {
    const jobPostingData = req.body;

    const newJob = await JobPostingService.createJobPosting(jobPostingData)

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.CREATE, data: newJob }, 'Job posting');
})

/**
 * Updates job posting by id
 * @route PATCH /api/job/postings/:id
 */
export const updateJobPosting = catchAsync(async (req, res) => {
    const { id } = req.params;
    const jobPosting = req.body;

    const updatedJobPosting = await JobPostingService.updateJobPosting(id, jobPosting)

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.UPDATE, data: updatedJobPosting }, 'Job posting');
})

/**
 * Deletes job posting by id
 * @route DELETE /api/job-postings/:id
 */
export const deleteJobPosting = catchAsync(async (req, res) => {
    const { id } = req.params;

    const deletedJobPosting = await JobPostingService.deleteJobPosting(id)

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.DELETE, data: deletedJobPosting }, 'Job posting')
})