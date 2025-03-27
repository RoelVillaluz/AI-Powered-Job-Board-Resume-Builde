import Resume from "../models/resumeModel.js";
import { checkMissingFields } from "../utils.js";
import { sendResponse, STATUS_MESSAGES } from "../constants.js";
import mongoose from "mongoose";

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

export const getResumesByUser = async (req, res) => {
    const { userId } = req.params;
    try {
        const resumes = await Resume.find({ user: userId })
        if (!resumes.length) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false}, 'Resumes')
        }
        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: resumes}, 'Resume' )
    } catch (error) {
        console.error('Error', error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false })
    }
}

export const createResume = async (req, res) => {
    let resumeData = req.body;
    const requiredFields = ['user', 'firstName', 'lastName', 'phone', 'address'];

    try {
        // Check for missing required fields
        const missingField = checkMissingFields(requiredFields, resumeData);
        if (missingField) {
            return sendResponse(res, STATUS_MESSAGES.ERROR.MISSING_FIELD(missingField), 'Resume');
        }

        // Validate and extract user ID
        const userId = resumeData.user?.id || resumeData.user;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.error('Invalid user ID:', userId);
            return res.status(400).json({ message: 'Invalid user ID format', success: false });
        }

        console.log('Creating resume for user:', userId);

        // Filter out empty string values from resumeData
        resumeData = Object.fromEntries(
            Object.entries(resumeData).filter(([_, value]) => value !== "")
        );

        // Ensure arrays do not contain empty objects
        resumeData.certifications = resumeData.certifications?.filter(cert => cert.name && cert.year) || [];
        resumeData.workExperience = resumeData.workExperience?.filter(exp => exp.jobTitle && exp.company) || [];
        resumeData.skills = resumeData.skills || [];

        // Create new resume
        const newResume = new Resume({
            ...resumeData,
            user: new mongoose.Types.ObjectId(userId),
        });

        console.log('Final resume data before saving:', newResume);

        // Save to database
        await newResume.save();

        console.log('Resume saved:', newResume);
        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.CREATE, data: newResume }, 'Resume');
    } catch (error) {
        console.error('Error creating resume:', error);
        return res.status(500).json({ message: error.message, error });
    }
};


export const updateResume = async (req, res) => {
    const { id } = req.params
    const resume = req.body

    try {
        const updatedResume = await Resume.findByIdAndUpdate(
            id,
            { ...resume, score: 0},
            { new: true}
        )
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