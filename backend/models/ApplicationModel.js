import mongoose, { mongo } from "mongoose";

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
        enum: ['Pending', 'Reviewed', 'Accepted', 'Rejected'],
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

applicationSchema.pre('save')

const Application = new mongoose.model("Application", applicationSchema)
export default Application