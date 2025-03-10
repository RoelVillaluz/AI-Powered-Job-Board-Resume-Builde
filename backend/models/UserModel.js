import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import Company from "./companyModel.js"
import Resume from "./resumeModel.js"

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: undefined, 
        enum: ['jobseeker', 'employer'],
    },
    profilePicture: {
        type: String,
        required: false
    },
    isVerified: {
        type: Boolean,
        required: true,
        default: false
    },
    verificationCode: {
        type: String,
        required: false
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        default: undefined, 
        ref: "Company",
        validate: {
            validator: function () {
                return this.role === "employer";
            },
            message: "Only employers can have associated companies."
        }        
    },
    resumes: [{
        type: mongoose.Schema.Types.ObjectId,
        default: undefined, 
        ref: "Resume",
        select: false, 
        validate: {
            validator: function () {
                // Only allow resumes field if the role is 'jobseeker'
                return this.role === "jobseeker";
            },
            message: "Only jobseekers can have associated resumes."
        }
    }],
    savedJobs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "JobPosting",
        validate: {
            validator: function () {
                return this.role === "jobseeker";
            },
            message: "Only jobseekers can save jobs."
        }
    }],
    streakCount: {
        type: Number,
        default: 0
    },
    lastLoginDate: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

userSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
    if (this.role === 'jobseeker') {
        await Resume.deleteMany({ _id: { $in: this.resumes }})
    } else if (this.role === 'employer') {
        await Company.deleteOne({ _id: this.company })
    }
    next();
}) 

const User = mongoose.model('User', userSchema)
export default User