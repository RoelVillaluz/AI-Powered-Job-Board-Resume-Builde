import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        requried: true
    },
    industry: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    website: {
        type: String
    },
    size: {
        type: Number,
    },
    description: {
        type: String,
        required: true
    },
    logo: {
        type: String
    },
    jobs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "JobPosting"
    }]
}, { timestamps: true })


export default mongoose.model("Company", companySchema);