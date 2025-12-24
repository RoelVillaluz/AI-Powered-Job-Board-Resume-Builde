import JobPosting from "../models/jobPostingModel.js"
import * as JobPostingService from "../services/jobPostings/jobPostingServices.js";
import { checkMissingFields } from '../utils.js'
import { STATUS_MESSAGES, sendResponse } from '../constants.js';
import { catchAsync } from "../utils/errorUtils.js";
import User from "../models/userModel.js";

/**
 * Get paginated list of job postings
 * @route GET /api/job-postings
 */
export const getJobPostings = catchAsync(async (req, res) => {
    const cursor = req.query.cursor || null;
    const limit = Number(req.query.limit) || 6;
    const excludeIds = req.query.exclude
        ? req.query.exclude.split(',')
        : [];

    const result = await JobPostingService.getJobPostings({
        cursor,
        limit,
        excludeIds
    });

    return res.status(200).json({
        success: true,
        formattedMessage: 'Job postings fetched successfully',
        data: result
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