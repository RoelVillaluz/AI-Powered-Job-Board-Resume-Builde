import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    firsName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    summary: {
        type: String,
        required: true
    },
    skills: [String],
    workExperience: [{
        job_title: String,
        company: String,
        startDate: String,
        endDate: String,
        responsibilities: String
    }],
    certifications: [{
        name: String,
        year: Number,
    }],
    socialMedia: [{
        facebook: { type: String, default: null },
        linkedin: { type: String, default: null },
        github: { type: String, default: null },
        website: { type: String, default: null }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const Resume = mongoose.model('Resume', resumeSchema)
export default Resume