import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
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
    skills: [{
        name: String,
        level: String
    }],
    workExperience: [{
        jobTitle: String,
        company: String,
        startDate: Date,
        endDate: Date,
        responsibilities: [String]
    }],
    certifications: [{
        name: String,
        year: String,
    }],
    socialMedia: {  
        facebook: { type: String, default: null },
        linkedin: { type: String, default: null },
        github: { type: String, default: null },
        website: { type: String, default: null }
    },
    score: {
        type: Number,
        default: 0
    },
    predictedSalary: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Resume = mongoose.model('Resume', resumeSchema);
export default Resume;
