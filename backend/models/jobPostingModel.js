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
    skills: {
        type: [String],
        required: true
    },
    postedAt: {
        type: Date,
        default: Date.now
    }   
})

const JobPosting = mongoose.model("JobPosting", jobPostingSchema)
export default JobPosting