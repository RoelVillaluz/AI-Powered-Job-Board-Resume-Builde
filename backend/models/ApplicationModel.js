import mongoose, { mongo } from "mongoose";
import User from "./userModel.js";

const applicationSchema = new mongoose.Schema({
    jobPosting: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "JobPosting",
        required: true,
    },
    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    resume: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resume',
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Interviewing', 'Accepted', 'Rejected'],
        default: 'Pending'
    },
    appliedAt: {
        type: Date,
        default: Date.now
    },
    reviewedAt: {
        type: Date,
        default: null
    },
})

applicationSchema.pre('save', async function (next) {
    const application = this;

    try {
        const applicant = await User.findById(application.applicant);
        
        if (!applicant) {
            return next(new Error("Applicant not found"));
        }

        if (applicant.role !== 'jobseeker') {
            return next(new Error("Only jobseekers can apply for jobs"));
        }

        return next();
    } catch (error) {
        return next(error); 
    }
});


const Application = new mongoose.model("Application", applicationSchema)
export default Application