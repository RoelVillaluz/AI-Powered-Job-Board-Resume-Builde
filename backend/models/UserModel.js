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
    firstName: { 
        type: String, 
        required: true 
    },
    lastName: { 
        type: String, 
        required: true 
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
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Helper function for role-based validation
function validateRole(field, role) {
    return function () {
        // Skip validation if role is not set yet
        if (!this.role) return true; 
        
        // For employers, these fields should be undefined (not exist or be empty array)
        if (this.role === 'employer' && role === 'jobseeker') {
            // Field must be undefined or empty array
            return this[field] === undefined || 
                   (Array.isArray(this[field]) && this[field].length === 0);
        }
        
        // For jobseekers, company should be undefined
        if (this.role === 'jobseeker' && role === 'employer') {
            return this[field] === undefined;
        }
        
        // Field is allowed for this role
        return this.role === role;
    };
}

// Apply role-based validation dynamically
userSchema.path("company").validate(validateRole("company", "employer"), "Only employers can have associated companies.");
userSchema.path("resumes").validate(validateRole("resumes", "jobseeker"), "Only jobseekers can have associated resumes.");
userSchema.path("savedJobs").validate(validateRole("savedJobs", "jobseeker"), "Only jobseekers can save jobs.");
userSchema.path("appliedJobs").validate(validateRole("appliedJobs", "jobseeker"), "Only jobseekers can apply to jobs.");

// Pre-save hook to clean up role-specific fields BEFORE validation runs
userSchema.pre('validate', function(next) {
  if (this.role === 'employer') {
    // Remove jobseeker-specific fields for employers
    this.resumes = undefined;
    this.savedJobs = undefined;
    this.appliedJobs = undefined;
  } else if (this.role === 'jobseeker') {
    // Remove employer-specific fields for jobseekers
    this.company = undefined;
  }
  next();
});

userSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
    if (this.role === 'jobseeker') {
        await Resume.deleteMany({ _id: { $in: this.resumes }});
    } else if (this.role === 'employer') {
        await Company.deleteOne({ _id: this.company });
    }
    next();
}); 

userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`
})

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;