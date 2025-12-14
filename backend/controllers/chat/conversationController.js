import Conversation from '../../models/chat/conversationModel.js';
import Message from '../../models/chat/messageModel.js';
import { STATUS_MESSAGES, sendResponse } from '../../constants.js';
import { transformConversationsForUser } from '../../services/transformers/conversationTransformers.js';
import { catchAsync } from '../../utils/errorUtils.js';

/**
 * Get all conversations
 * @route GET /api/conversations
 * @access Public
 */

export const getConversations = catchAsync(async (req, res, next) => {
    const conversations = await Conversation.find({});
    
    return sendResponse(res, { 
        ...STATUS_MESSAGES.SUCCESS.FETCH, 
        data: conversations 
    }, 'Conversations');
});

/**
 * Get conversation by ID with messages
 * @route GET /api/conversations/:conversationId
 * @access Private
 */

export const getConversationById = catchAsync(async (req, res, next) => {
    const { conversationId } = req.params;
    const { limit = 20, before } = req.query;

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

    // Fetch messages with proper sorting and pagination
    const messages = await Message.find({
        _id: { $in: conversation.messages },
        ...messageQuery,
    })
    .sort({ createdAt: -1 }) // ✅ Get newest first from DB
    .limit(parseInt(limit))   // ✅ Limit at DB level
    .populate('sender', 'firstName lastName')
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

/**
 * Get all conversations for a user
 * @route GET /api/conversations/user/:userId
 * @access Private
 */

export const getConversationsByUser = catchAsync(async (req, res, next) => {
    const { userId } = req.params;

    // ✅ No try-catch - catchAsync handles it
    let conversations = await Conversation.find({ users: userId })
        .populate('users', 'firstName lastName email profilePicture')
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
                    select: 'firstName lastName profilePicture'  
                },
                {
                    path: 'attachment',
                    select: 'url fileName type fileSize'
                }
            ]
        })
        .lean();

    // ✅ Transform data using service - clean and reusable!
    const transformedConversations = transformConversationsForUser(conversations, userId);

    return sendResponse(res, { 
        ...STATUS_MESSAGES.SUCCESS.FETCH, 
        data: transformedConversations
    }, 'Conversations');
});