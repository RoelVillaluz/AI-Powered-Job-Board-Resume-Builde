import mongoose from "mongoose";

const jobPostingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    company_name: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    job_type: {
        type: String,
        enum: ['Full-Time', 'Part-Time', 'Contract', 'Internship'],
        required: true
    },
    salary: {
        type: String,
        default: null
    },
    requirements: {
        type: String,
        required: true
    },
    posted_by: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        required: true
    },
    posted_at: {
        type: Date,
        default: Date.now
    }   
})

const JobPosting = mongoose.model("JobPosting", jobPostingSchema)
export default JobPosting