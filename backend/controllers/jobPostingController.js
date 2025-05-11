import JobPosting from "../models/jobPostingModel.js"
import { checkMissingFields } from '../utils.js'
import { STATUS_MESSAGES, sendResponse } from '../constants.js';
import User from "../models/userModel.js";

export const getJobPostings = async (req, res) => {
    try {
        const jobPostings = await JobPosting.find({}).populate("company", "id name logo");
        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: jobPostings }, 'Job postings')
    } catch (error) {
        console.error(error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false })
    }
}

export const getJobPosting = async (req, res) => {
    const { id } = req.params
    try {
        const jobPosting = await JobPosting.findById(id).populate("company", "id name logo").populate("applicants", "profilePicture");
        if (!jobPosting) {
            return res.status(404).json({ success: false, message: 'Job posting not found' })
        }

        jobPosting.applicants.forEach((applicant) => {
            if (applicant.profilePicture) {
                console.log("Original user profile picture", applicant.profilePicture) // Debugging: Check original profile picture
                applicant.profilePicture = applicant.profilePicture.replace(/\\/g, '/');
                applicant.profilePicture = `profile_pictures/${applicant.profilePicture.split('/').pop()}`
                console.log("Normalized user profile picture:", applicant.profilePicture); // Debugging: Check normalized path
            } else {
                applicant.profilePicture = 'profile_pictures/default.jpg'
            }
        })

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: jobPosting }, 'Job posting')
    } catch (error) {
        console.error(error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false })
    }
}

export const createJobPosting = async (req, res) => {
    const jobPosting = req.body
    const requiredFields = ['title', 'company', 'location', 'jobType', 'requirements', 'skills']

    const missingField = checkMissingFields(requiredFields, jobPosting)
    if (missingField) {
        return sendResponse(res, STATUS_MESSAGES.ERROR.MISSING_FIELD(missingField), 'Job posting');
    }

    try {

        const newJob = new JobPosting(jobPosting)
        await newJob.save()

        // add job to company jobs list
        await Company.findByIdAndUpdate(
            jobPosting.company,
            { $push: { jobs: newJob } },
            { new: true }
        )

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.CREATE, data: newJob }, 'Job posting');
    } catch (error) {
        console.error('Error', error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false })
    }
}

export const updateJobPosting = async (req, res) => {
    const { id } = req.params;
    const jobPosting = req.body

    try {
        const updatedJobPosting = await jobPosting.findByIdAndUpdate(id, user, { new: true })
        if (!updatedJobPosting) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false}, 'Job posting')
        }
        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.UPDATE, data: updatedJobPosting }, 'Job posting');
    } catch (error) {
        console.error('Error', error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false })
    }
}

export const deleteJobPosting = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedJobPosting = await JobPosting.findByIdAndDelete(id)

        if (!deletedJobPosting) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false}, 'Job posting')
        }
        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.DELETE }, 'Job posting')
    } catch (error) {
        console.error('Error deleting job posting:', error);
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false });
    }
}