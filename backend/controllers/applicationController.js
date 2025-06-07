import Application from "../models/applicationModel.js";
import { STATUS_MESSAGES, sendResponse } from '../constants.js';
import mongoose from "mongoose";

export const getApplications = async (req, res) => {
    try {
        const applications = await Application.find({})

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: applications }, 'Applications');
    } catch (error) {
        console.error('Error fetching applications: ', error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false });
    }
}

export const getApplicationById = async (req, res) => {
    const { applicationId } = req.params;

    try {
        const application = await Application.findById(applicationId)

        if (!application) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false}, 'Application')
        }

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: application }, 'Application');
    } catch (error) {
        console.error('Error fetching application: ', error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false });
    }
}

export const getApplicationsByUser = async (req, res) => {
    const { userId } = req.params;

    try {
        const applications = await Application.find({ applicant: new mongoose.Types.ObjectId(userId) })
        
        if (!applications) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false}, 'Application')
        }

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: applications }, 'Applications');
    } catch (error) {
        console.error('Error fetching application: ', error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false });
    }
}
