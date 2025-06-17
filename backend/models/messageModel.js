import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
            required: true
    },
    content: {
        type: String,
        required: true
    },
}, { timestamps: true })

const Message = mongoose.model('Message', messageSchema)
export default Message