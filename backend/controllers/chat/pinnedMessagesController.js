import Conversation from '../../models/chat/conversationModel.js';
import Message from '../../models/chat/messageModel.js';
import { STATUS_MESSAGES, sendResponse } from '../../constants.js';
import mongoose from 'mongoose';

export const getPinnedMessagesByConversationId = async (req, res) => {
    const { conversationId } = req.params;
    
    try {
        const conversation = await Conversation.findById(conversationId)
            .populate({
                path: "messages",
                match: { isPinned: true },
                populate: [
                    {
                        path: "sender",
                        select: "name"
                    },
                    {
                        path: "attachment",
                        select: "fileName fileSize type url"
                    }
                ]
            })

        if (!conversation) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, 'Conversation')
        }

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: conversation.messages }, 'Conversation')
    } catch (error) {
        console.error('Error fetching pinned messages for conversation: ', conversationId)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false }, 'Conversation')
    }
}

export const getPinnedMessagesCountByConversationId = async (req, res) => {
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

        const pinnedMessagesCount = await Message.countDocuments({
            conversation: conversationId,
            isPinned: true
        })

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: { count: pinnedMessagesCount }}, 'Conversation');
    } catch (error) {
        console.error(`Error fetching pinned messages count for conversation: ${conversationId}`, error);
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false });
    }
}