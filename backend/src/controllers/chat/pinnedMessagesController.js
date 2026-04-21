import Conversation from '../../models/chat/conversationModel.js';
import Message from '../../models/chat/messageModel.js';
import { STATUS_MESSAGES, sendResponse } from '../../constants.js';
import mongoose from 'mongoose';
import { catchAsync } from '../../utils/errorUtils.js';

export const getPinnedMessagesByConversationId = catchAsync(async (req, res) => {
    const { conversationId } = req.params;
    const { page = 1, limit = 5 } = req.query;
    
    const conversation = await Conversation.findById(conversationId);

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
})

export const getPinnedMessagesCountByConversationId = catchAsync(async (req, res) => {
    const { conversationId } = req.params;

    const pinnedMessagesCount = await Message.countDocuments({
        conversation: conversationId,
        isPinned: true
    })

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: { count: pinnedMessagesCount }}, 'Conversation');
})