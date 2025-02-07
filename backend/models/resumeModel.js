import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    first_name: {
        type: String,
        required: true
    },
    last_name: {
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
    work_experience: [{
        job_title: String,
        company: String,
        start_date: String,
        end_date: String,
        responsibilities: String
    }],
    certifications: [{
        name: String,
        year: Number,
    }],
    social_media: [{
        facebook: { type: String, default: null },
        linkedin: { type: String, default: null },
        github: { type: String, default: null },
        website: { type: String, default: null }
    }],
    created_at: {
        type: Date,
        default: Date.now
    }
})

const Resume = mongoose.model('Resume', resumeSchema)
export default Resume