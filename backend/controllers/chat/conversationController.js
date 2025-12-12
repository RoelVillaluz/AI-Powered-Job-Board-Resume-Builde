import Conversation from '../../models/chat/conversationModel.js';
import Message from '../../models/chat/messageModel.js';
import User from '../../models/UserModel.js'
import { STATUS_MESSAGES, sendResponse } from '../../constants.js';
import mongoose from 'mongoose';
import { NotFoundError, ValidationError } from '../../middleware/errorHandler.js';
import { catchAsync } from '../../utils/errorUtils.js';

export const getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({})

        if (!conversations) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, 'Conversations')
        }

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: conversations }, 'Conversations')
    } catch (error) {
        console.error('Error fetching Conversations: ', error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false })
    }
}

export const getConversationById = catchAsync(async (req, res, next) => {
    const { conversationId } = req.params;
    const { limit = 20, before } = req.query;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return next(new ValidationError('Invalid conversation ID format'))
    }

    // Build message query
    let messageQuery = {};
    if (before) {
        // For pagination: get messages older than 'before' timestamp
        const beforeMessage = await Message.findById(before);
        if (beforeMessage) {
            messageQuery.createdAt = { $lt: beforeMessage.createdAt };
        }
    }

    // ✅ Better approach: Fetch conversation and messages separately for more control
    const conversation = await Conversation.findById(conversationId)
        .populate('users', 'firstName lastName email profilePicture')

    if (!conversation) {
        return next(new NotFoundError('Conversation'))
    }

    // Fetch messages with proper sorting and pagination
    const messages = await Message.find({
        _id: { $in: conversation.messages },
        ...messageQuery,
    })
    .sort({ createdAt: -1 }) // ✅ Get newest first from DB
    .limit(parseInt(limit))   // ✅ Limit at DB level
    .populate('sender', 'fullName')
    .populate('attachment', 'fileName fileSize url type')
    .select('_id sender content createdAt updatedAt seen seenAt attachment isPinned')
    .lean(); // ✅ Faster - returns plain JS objects

    const conversationWithMessages = {
        ...conversation.toObject(),
        messages
    };

    return sendResponse(res, { 
        ...STATUS_MESSAGES.SUCCESS.FETCH, 
        data: conversationWithMessages 
    }, 'Conversation');
})

export const getConversationsByUser = catchAsync(async (req, res, next) => {
    const { userId } = req.params;

    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
        return next(new NotFoundError('User'))
    }

    // ✅ No try-catch - catchAsync handles it
    let conversations = await Conversation.find({ users: userId })
        .populate('users', 'fullName email profilePicture')
        .populate({
            path: 'messages',
            options: {
                limit: 50,
                sort: { createdAt: -1 }
            },
            select: '_id sender content createdAt updatedAt seen seenAt attachment isPinned',
            populate: [
                {
                    path: 'sender',
                    select: 'fullName profilePicture'  
                },
                {
                    path: 'attachment',
                    select: 'url fileName type fileSize'
                }
            ]
        })
        .lean();

    // ✅ Transform data (this logic should ideally be in a service/transformer)
    conversations = conversations.map(convo => {
        const receiver = convo.users.find(user => user._id.toString() !== userId);

        if (receiver.profilePicture) {
            receiver.profilePicture = receiver.profilePicture.replace(/\\/g, '/');
            receiver.profilePicture = `profile_pictures/${receiver.profilePicture.split('/').pop()}`;
        } else {
            receiver.profilePicture = 'profile_pictures/default.jpg';
        }

        convo.messages.forEach(message => {
            if (message.sender.profilePicture) {
                message.sender.profilePicture = message.sender.profilePicture.replace(/\\/g, '/');
                message.sender.profilePicture = `profile_pictures/${message.sender.profilePicture.split('/').pop()}`;
            } else {
                message.sender.profilePicture = 'profile_pictures/default.jpg';
            }

            // Transform attachment URL if it exists and is populated
            if (message.attachment) {
                // Check if attachment is populated as an object
                if (typeof message.attachment === 'object' && message.attachment.url) {
                    if (typeof message.attachment.url === 'string') {
                        message.attachment.url = message.attachment.url.replace(/\\/g, '/');
                        message.attachment.url = `message_attachments/${message.attachment.url.split('/').pop()}`;
                    }
                } 
                // Handle case where attachment might be a string
                else if (typeof message.attachment === 'string') {
                    message.attachment = message.attachment.replace(/\\/g, '/');
                    message.attachment = `message_attachments/${message.attachment.split('/').pop()}`;
                }
            }
        });

        return {
            ...convo,
            receiver,
        };
    });

    return sendResponse(res, { 
        ...STATUS_MESSAGES.SUCCESS.FETCH, 
        data: conversations 
    }, 'Conversations');
});