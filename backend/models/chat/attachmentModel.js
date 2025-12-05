import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
    conversation: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation', 
        index: true 
    },
    message: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message', 
        index: true 
    },
    fileName: { 
        type: String, 
        required: true 
    },
    fileSize: { 
        type: Number, 
        required: true 
    }, // bytes
    url: { 
        type: String, 
        required: true 
    },
    thumbnail: { 
        type: String, 
        default: null 
    },
    type: { 
        type: String, 
        enum: ['image', 'pdf', 'voice', 'video'], 
        default: 'image' 
    }
}, { timestamps: true });

const Attachment = mongoose.model("Attachment", attachmentSchema);
export default Attachment;
