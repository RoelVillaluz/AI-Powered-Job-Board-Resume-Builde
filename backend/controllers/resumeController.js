import Resume from "../models/resumeModel.js";
import { checkMissingFields } from "../utils.js";
import { sendResponse, STATUS_MESSAGES } from "../constants.js";

export const getResumes = async (req, res) => {
    try {
        const resumes = await Resume.find({})
        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: resumes }, 'Resumes')
    } catch (error) {
        console.error('Error', error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, succes: false })
    }
}

export const getResume = async (req, res) => {
    const { id } = req.params;

    try {
        const resume = await Resume.findById(id)
        if (!resume) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false}, 'Resume')
        }
        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: resume}, 'Resume' )
    } catch (error) {
        console.error('Error', error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false })
    }
}

export const createResume = async (req, res) => {
    const resume = req.body
    const requiredFields = ['user', 'first_name', 'last_name', 'email', 'phone', 'address']

    try {
        const missingField = checkMissingFields(requiredFields, resume)

        if (missingField) {
            return sendResponse(res, STATUS_MESSAGES.ERROR.MISSING_FIELD(missingField), 'Resume');
        }

        const newResume = await Resume(resume)
        newResume.save()
        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.CREATE, data: newResume }, 'Resume');
    } catch {
        console.error('Error creating resume:', error.message);
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false });
    }
}

export const updateResume = async (req, res) => {
    const { id } = req.params
    const resume = req.body

    try {
        const updatedResume = await Resume.findByIdAndUpdate(id, resume, { new: true })
        if (!updatedResume) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, 'Resume');
        }
        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.UPDATE, data: updatedResume }, 'Resume');
    } catch (error) {
        console.error('Error updating resume:', error);
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false });
    }
}

export const deleteResume = async (req, res) => {
    const { id } = req.params
    try {
        const deletedResume = await Resume.findByIdAndDelete(id)
        if (!deletedResume) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, 'Resume');
        }
        return sendResponse(res, STATUS_MESSAGES.SUCCESS.DELETE, 'Resume');
    } catch (error) {
        console.error('Error deleting user:', error);
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false });
    }
}