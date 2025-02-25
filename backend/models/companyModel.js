import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        unique: true,
        required: true
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


// Middleware to delete related jobs when a company is deleted
companySchema.pre("deleteOne", { document: true, query: false }, async function (next) {
    await JobPosting.deleteMany({ _id: { $in: this.job } })
    next();
})


export default mongoose.model("Company", companySchema);