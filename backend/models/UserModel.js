import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import Company from "./companyModel.js";
import Resume from "./resumeModel.js";

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
        ref: "Company",
        default: undefined, 
    },
    resumes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resume",
        select: false, 
    }],
    savedJobs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "JobPosting",
    }],
    appliedJobs: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: "JobPosting",
    }],
    streakCount: {
        type: Number,
        default: 0
    },
    loggedInDates: [
        { type: String }
    ],
    viewsHistory: [{
        date: { type: String, required: true },  
        count: { type: Number, default: 0 },  
        viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]  
    }],    
    preferences: {
        jobType: {
            type: String,
            enum: ['Full-Time', 'Part-Time', 'Contract', 'Internship'],
            default: null
        },
        experienceLevel: {
            type: String,
            enum: ['Intern', 'Entry', 'Mid-Level', 'Senior'],
            default: null
        },
        salary: {
            min: {
                type: Number,
                default: null
            },
            max: {
                type: Number,
                default: null
            }
        }
    },
    connections: [{
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User" 
        }, 
        status: { 
            type: String, 
            enum: ['Accepted', 'Pending', 'Rejected'], 
            default: 'Pending' 
        }
    }],
    industry: {
        type: String,
        enum: [
            "Technology",
            "Healthcare",
            "Finance",
            "Education",
            "Retail",
            "Manufacturing",
            "Media",
            "Entertainment",
            "Energy",
            "Transportation",
            "Government",
        ]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Helper function for role-based validation
function validateRole(field, role) {
    return function () {
        if (!this.role) return true; 
        return this.role === role;
    };
}

// Apply role-based validation dynamically
userSchema.path("company").validate(validateRole("company", "employer"), "Only employers can have associated companies.");
userSchema.path("resumes").validate(validateRole("resumes", "jobseeker"), "Only jobseekers can have associated resumes.");
userSchema.path("savedJobs").validate(validateRole("savedJobs", "jobseeker"), "Only jobseekers can save jobs.");
userSchema.path("appliedJobs").validate(validateRole("appliedJobs", "jobseeker"), "Only jobseekers can apply to jobs.");

userSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
    if (this.role === 'jobseeker') {
        await Resume.deleteMany({ _id: { $in: this.resumes }});
    } else if (this.role === 'employer') {
        await Company.deleteOne({ _id: this.company });
    }
    next();
}); 

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
