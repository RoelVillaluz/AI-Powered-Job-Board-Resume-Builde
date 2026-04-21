import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true
    },
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
        type: mongoose.Schema.Types.ObjectId,
        ref: "Attachment",
        default: null,
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    linkPreview: {
        url: { type: String, default: null },
        title: { type: String, default: null },
        description: { type: String, default: null },
        image: { type: String, default: null },
        siteName: { type: String, default: null },
        favicon: { type: String, default: null }
    },
}, { timestamps: { createdAt: true, updatedAt: false } })

// Compound index for conversation queries with sorting
messageSchema.index({ conversation: 1, createdAt: -1 })

// Index for pinned messages
messageSchema.index({ conversation: 1, isPinned: 1 });

// Index for sender queries
messageSchema.index({ sender: 1 });

// Index for unseen messages
messageSchema.index({ conversation: 1, seen: 1 });

// Index for attachment queries
messageSchema.index({ conversation: 1, attachment: 1 });

// Full-text search on content (optional)
messageSchema.index({ content: 'text' });

const Message = mongoose.model('Message', messageSchema)
export default Message