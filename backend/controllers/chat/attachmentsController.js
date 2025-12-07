import Conversation from '../../models/chat/conversationModel.js';
import Message from '../../models/chat/messageModel.js';
import { STATUS_MESSAGES, sendResponse } from '../../constants.js';
import mongoose from 'mongoose';

export const getAttachmentsByConversationId = async (req, res) => {
    const { conversationId } = req.params;

    try {
        const conversation = await Conversation.findById(conversationId)
            .populate({
                path: "messages",
                match: { attachment: { $exists: true, $ne: null } },
                select: "attachment createdAt",
                options: { sort: { createdAt: -1 } },
                populate: {
                    path: "attachment",
                    select: "url"
                }
            })
            .lean();

            // Normalize attachment URLs at backend level
            const messagesWithAttachments = conversation.messages.map((msg) => {
                if (!msg.attachment) return msg;

                let url = typeof msg.attachment === "object" ? msg.attachment.url : msg.attachment;
                url = url.replace(/\\/g, "/");
                url = `message_attachments/${url.split("/").pop()}`;

                // If attachment is an object, keep it as object with normalized url
                if (typeof msg.attachment === "object") msg.attachment.url = url;
                else msg.attachment = url;

                return msg;
            });

            return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: messagesWithAttachments }, "Conversation");
        } catch (error) {
            console.error(`Error fetching messages with attachments for conversation: ${conversationId}`, error);
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false });
    }
}

export const getAttachmentCountsByConversationId = async (req, res) => {
    const { conversationId } = req.params;

    try {
        
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return sendResponse(res, {
                ...STATUS_MESSAGES.ERROR.BAD_REQUEST,
                message: "Invalid conversationId",
                success: false
            }, 'Conversation');
        }

        const conversationExists = await Conversation.exists({ _id: conversationId });
        if (!conversationExists) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, 'Conversation');
        }

        const messagesWithAttachmentsCount = await Message.countDocuments({
            conversation: conversationId,
            attachment: { $ne: null }
        })

        console.log("Attachment count:", messagesWithAttachmentsCount); // Debug

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: { count: messagesWithAttachmentsCount } }, 'Conversation');
    } catch (error) {
        console.error(`Error fetching message with attachments count for conversation: ${conversationId}`, error);
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false });
    }
}
