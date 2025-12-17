import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    users: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    ],
    messages: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message'
        }
    ]
}, { timestamps: true })

// Index for finding user's conversations
conversationSchema.index({ users: 1 });

// Compound index for users array queries
conversationSchema.index({ users: 1, updatedAt: -1 });

// Index for last message
conversationSchema.index({ lastMessage: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema)
export default Conversation