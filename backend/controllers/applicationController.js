import Application from "../models/applicationModel.js";
import { STATUS_MESSAGES, sendResponse } from '../constants.js';
import { formatApplicationData } from "../utils.js";
import mongoose from "mongoose";

export const getApplications = async (req, res) => {
    try {
        let applications = await Application.find({}).populate('jobPosting');

        applications = formatApplicationData(applications)

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: applications }, 'Applications');
    } catch (error) {
        console.error('Error fetching applications: ', error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false });
    }
}

export const getApplicationById = async (req, res) => {
    const { applicationId } = req.params;

    try {
        let application = await Application.findById(applicationId).populate('jobPosting')

        application = formatApplicationData(application)

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
        let applications = await Application.find({ applicant: new mongoose.Types.ObjectId(userId) }).populate('jobPosting')

        applications = formatApplicationData(applications)
        
        if (!applications) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false}, 'Application')
        }

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: applications }, 'Applications');
    } catch (error) {
        console.error('Error fetching application: ', error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false });
    }
}
