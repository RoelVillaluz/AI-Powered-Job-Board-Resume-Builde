import Conversation from '../../models/chat/conversationModel.js';
import Message from '../../models/chat/messageModel.js';
import { STATUS_MESSAGES, sendResponse } from '../../constants.js';
import mongoose from 'mongoose';

export const getPinnedMessagesByConversationId = async (req, res) => {
    const { conversationId } = req.params;
    const { page = 1, limit = 5 } = req.query;
    
    try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, 'Conversation')
        }

        const totalPinned = await Message.countDocuments({
            _id: { $in: conversation.messages },
            isPinned: true
        })

        const skip = (page - 1) * limit;
        const messages = await Message.find({
            _id: { $in: conversation.messages },
            isPinned: true
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('sender', 'name profilePicture')
        .populate('attachment', 'fileName fileSize type url')
        .lean()

        return sendResponse(res, { 
            ...STATUS_MESSAGES.SUCCESS.FETCH, 
            data: {
                messages,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalPinned / limit),
                    totalItems: totalPinned,
                    itemsPerPage: parseInt(limit),
                    hasMore: skip + messages.length < totalPinned
                }
            }
        }, 'Conversation')
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