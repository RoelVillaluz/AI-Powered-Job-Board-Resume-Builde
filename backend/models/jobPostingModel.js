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
        currency: {
            type: String,
            enum: ['$', '₱', '€', '¥', '£'], 
            default: '$'
        },
        amount: {
            type: Number,
            default: null
        },
        frequency: {
            type: String,
            enum: ['hour', 'day', 'week', 'month', 'year'],
            default: 'year'
        }
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
        required: { type: Boolean, default: false }, // Flag to indicate if answering the question is mandatory
        default: {}
    }],
    applicants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    postedAt: {
        type: Date,
        default: Date.now
    }   
})

const JobPosting = new mongoose.model("JobPosting", jobPostingSchema)
export default JobPosting