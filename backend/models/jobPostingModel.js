import mongoose from "mongoose";

const jobPostingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true
    },
    location: {
        type: String,
        required: true
    },
    jobType: {
        type: String,
        enum: ['Full-Time', 'Part-Time', 'Contract', 'Internship'],
        required: true
    },
    experienceLevel: {
        type: String,
        enum: ['Intern', 'Entry', 'Mid-Level', 'Senior'],
        required: false,
    },  
    salary: {
        type: String,
        default: null
    },
    requirements: {
        type: [String],
        required: true
    },
    skills: [{
        name: { type: String, required: true }
    }],  
    preScreeningQuestions: [{
        question: { type: String, required: true },
        required: { type: Boolean, default: true }, // Flag to indicate if answering the question is mandatory
    }],
    postedAt: {
        type: Date,
        default: Date.now
    }   
})

const JobPosting = new mongoose.model("JobPosting", jobPostingSchema)
export default JobPosting