import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
    },
    content: {
        type: String,
        required: true
    },
    seen: {
        type: Boolean,
        default: false
    },
    seenAt: {
        type: Date,
        default: null
    },
    updatedAt: {
        type: Date,
        default: null
    },
    attachment: {
        type: String,
        default: null
    }
}, { timestamps: { createdAt: true, updatedAt: false } })

const Message = mongoose.model('Message', messageSchema)
export default Message