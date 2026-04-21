import mongoose from 'mongoose';

const TempUserSchema = new mongoose.Schema({
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
    },
    verificationCode: { 
        type: String, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now, 
        expires: 600 // Auto-delete after 10 minutes
    } 
});

export const TempUser = mongoose.model('TempUser', TempUserSchema);
