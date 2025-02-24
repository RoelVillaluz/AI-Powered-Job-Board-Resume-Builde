import mongoose from "mongoose";
import bcrypt from 'bcrypt';

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
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const User = mongoose.model('User', userSchema)
export default User