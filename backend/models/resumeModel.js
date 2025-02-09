import mongoose from "mongoose";
import skillCategories from "./skillCategories.js";

// flatten all skills into single array for validation
const allSkills = Object.values(skillCategories).flat();

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
        type: String,
        enum: allSkills,
    }],
    workExperience: [{
        jobTitle: String,
        company: String,
        startDate: String,
        endDate: String,
        responsibilities: String
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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Resume = mongoose.model('Resume', resumeSchema);
export default Resume;
