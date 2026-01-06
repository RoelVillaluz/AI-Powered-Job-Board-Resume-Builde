import User from '../models/userModel.js';
import { TempUser } from '../models/tempUserModel.js';
import Application from '../models/applicationModel.js';
import JobPosting from "../models/jobPostingModel.js"
import { checkMissingFields } from '../utils.js';
import { STATUS_MESSAGES, sendResponse } from '../constants.js';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';


export const applyToJob = async (req, res) => {
    const jobApplicationData = req.body;
    const { jobId } = req.params;
    const { answers } = req.body;

    const requiredFields = ['applicant', 'resume']

    // Check for missing fields
    const missingField = checkMissingFields(requiredFields, jobApplicationData);
    if (missingField) {
        return sendResponse(res, {...STATUS_MESSAGES.ERROR.MISSING_FIELD(missingField), success: false }, 'Job Application');
    }

    try {
        // Check if the job posting exists
        const jobPosting = await JobPosting.findById(jobId)
        if (!jobPosting) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, 'Job Posting')
        }

        // Validate and extract user ID
        const userId = jobApplicationData.applicant
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.error('Invalid user ID:', userId);
            return res.status(400).json({ message: 'Invalid user ID format', success: false });
        }

        const existingApplication = await Application.findOne({ applicant: userId, jobPosting: jobId })
        let newApplication = null;

        if (!existingApplication) {

            // Create the new application and associate it with the job posting
            newApplication = new Application({
                ...jobApplicationData,
                preScreeningAnswers: answers,
                jobPosting: new mongoose.Types.ObjectId(jobId),
                applicant: new mongoose.Types.ObjectId(userId)
            })

            await newApplication.save()

            // add job ID to user's applied jobs 
            await User.findByIdAndUpdate(userId, { $addToSet: { appliedJobs: new mongoose.Types.ObjectId(jobId) } })

            // add user to job applicants
            await JobPosting.findByIdAndUpdate(jobId, { $addToSet: { applicants: new mongoose.Types.ObjectId(userId) } })
        } else {
            await Application.findByIdAndDelete(existingApplication._id);

            // remove job from user's applied jobs
            await User.findByIdAndUpdate(userId, { $pull: { appliedJobs: new mongoose.Types.ObjectId(jobId) }})

            // remove user from job applicants
            await JobPosting.findByIdAndUpdate(jobId, { $pull: { applicants: new mongoose.Types.ObjectId(userId) }})
        }

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.CREATE, data: newApplication }, 'Job Application')
    } catch (error) {
        console.error('Error', error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false }, 'Job Application')
    }
}

export const sendConnectionRequest = async (req, res) => {
    const { userId, connectionId } = req.body; // SenderID, Receiver ID

    try {
        const user = await User.findById(userId)
        const userToAdd = await User.findById(connectionId)

        if (!user || !userToAdd) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, "User")
        }

        const existingConnection = user.connections.find(conn => conn.user.toString() === connectionId)

        let message;

        if (existingConnection) {
            // delete connection request
            user.connections = user.connections.filter(conn => conn.user.toString() !== connectionId);
            userToAdd.connections = userToAdd.connections.filter(conn => conn.user.toString() !== userId);

            message = `Removed connection request to ${connectionId}.`
        } else {
            // Add connection request (pending status)
            user.connections.push({ user: connectionId, status: 'Pending' })
            userToAdd.connections.push({ user: userId, status: "Pending" });

            message = `Connection request sent to ${connectionId}.`
        }

        await user.save()
        await userToAdd.save()

        return res.status(200).json({
            success: true,
            message: message,
            connections: user.connections,
        })
    } catch (error) {
        console.error('Error: ', error )
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false })
    }
}

export const trackUserLogin = async (req, res) => {
    const { userId } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Convert to local timezone
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to midnight
        const localDateString = today.toLocaleDateString("en-CA"); // YYYY-MM-DD format in local time

        if (!user.loggedInDates.includes(localDateString)) {
            user.loggedInDates.push(localDateString);
        }

        // Sort the dates in case they were stored out of order
        user.loggedInDates.sort();

        // Determine streak based on consecutive days
        let streak = 1;
        for (let i = user.loggedInDates.length - 1; i > 0; i--) {
            const prevDate = new Date(user.loggedInDates[i - 1]);
            const currDate = new Date(user.loggedInDates[i]);

            prevDate.setDate(prevDate.getDate() + 1); // Check if consecutive

            if (prevDate.toLocaleDateString("en-CA") === currDate.toLocaleDateString("en-CA")) {
                streak++;
            } else {
                break;
            }
        }

        user.streakCount = streak;

        await user.save();

        res.json({ message: "Login streak updated", streak: user.streakCount, loggedInDates: user.loggedInDates });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
