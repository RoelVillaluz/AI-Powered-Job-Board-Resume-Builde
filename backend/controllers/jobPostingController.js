import JobPosting from "../models/jobPostingModel.js"
import { checkMissingFields } from '../utils.js'
import { STATUS_MESSAGES, sendResponse } from '../constants.js';

export const getJobPostings = async (req, res) => {
    try {
        const jobPostings = await JobPosting.find({})
        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: jobPostings }, 'Job postings')
    } catch (error) {
        console.error(error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false })
    }
}

export const getJobPosting = async (req, res) => {
    const { id } = req.params
    try {
        const jobPosting = await JobPosting.findById(id)
        if (!jobPosting) {
            return res.status(404).json({ success: false, message: 'Job posting not found' })
        }
        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: jobPosting }, 'Job posting')
    } catch (error) {
        console.error(error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false })
    }
}

export const createJobPosting = async (req, res) => {
    const jobPosting = req.body
    const requiredFields = ['title', 'company_name', 'location', 'job_type', 'requirements', 'posted_by']

    const missingField = checkMissingFields(requiredFields, jobPosting)
    if (missingField) {
        return sendResponse(res, STATUS_MESSAGES.ERROR.MISSING_FIELD(missingField), 'Job posting');
    }

    try {
        const newJob = new JobPosting(jobPosting)
        await newJob.save()
        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.CREATE, data: newJob }, 'Job posting');
    } catch (error) {
        console.error('Error', error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false })
    }
}