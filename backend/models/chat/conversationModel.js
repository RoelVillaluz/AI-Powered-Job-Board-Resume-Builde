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

conversationSchema.index({ users: 1 })

const Conversation = mongoose.model('Conversation', conversationSchema)
export default Conversation