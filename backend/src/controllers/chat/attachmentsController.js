import Conversation from '../../models/chat/conversationModel.js';
import Message from '../../models/chat/messageModel.js';
import { STATUS_MESSAGES, sendResponse } from '../../constants.js';
import { catchAsync } from '../../utils/errorUtils.js';
import mongoose from 'mongoose';

export const getAttachmentsByConversationId = catchAsync(async (req, res) => {
    const { conversationId } = req.params;
    const { page = 1, limit = 9 } = req.query;
        
    const conversation = await Conversation.findById(conversationId);

    const totalAttachments = await Message.countDocuments({
        _id: { $in: conversation.messages },
        attachment: { $ne: null }
    });

    // Fetch paginated attacments
    const skip = (page - 1) * limit;
    const messages = await Message.find({
        _id: { $in: conversation.messages },
        attachment: { $ne: null }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('attachment', 'url fileName type fileSize')
    .select('attachment createdAt')
    .lean();

    // Normalize attachment URLs at backend level
    const messagesWithAttachments = messages.map((msg) => {
        if (!msg.attachment) return msg;

        let url = typeof msg.attachment === "object" ? msg.attachment.url : msg.attachment;
        url = url.replace(/\\/g, "/");
        url = `message_attachments/${url.split("/").pop()}`;

        // If attachment is an object, keep it as object with normalized url
        if (typeof msg.attachment === "object") msg.attachment.url = url;
        else msg.attachment = url;

        return msg;
    });

    return sendResponse(res, { 
        ...STATUS_MESSAGES.SUCCESS.FETCH, 
        data: {
            messagesWithAttachments,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalAttachments / limit),
                totalItems: totalAttachments,
                itemsPerPage: parseInt(limit),
                hasMore: skip + messages.length < totalAttachments
            }
        }
    }, "Conversation");
})

export const getAttachmentCountsByConversationId = catchAsync(async (req, res) => {
    const { conversationId } = req.params;

    const messagesWithAttachmentsCount = await Message.countDocuments({
        conversation: conversationId,
        attachment: { $ne: null }
    })

    console.log("Attachment count:", messagesWithAttachmentsCount); // Debug

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: { count: messagesWithAttachmentsCount } }, 'Conversation');
})