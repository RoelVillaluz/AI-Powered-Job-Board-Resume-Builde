import Conversation from '../../models/chat/conversationModel.js';
import Message from '../../models/chat/messageModel.js';
import { STATUS_MESSAGES, sendResponse } from '../../constants.js';
import { transformConversationsForUser } from '../../services/transformers/conversationTransformers.js';
import { catchAsync } from '../../utils/errorUtils.js';
import logger from '../../utils/logger.js';
import { findAllConversations, findConversationById, findConversationsByUser } from '../../repositories/chat/conversationRepository.js';

/**
 * Get all conversations
 * @route GET /api/conversations
 * @access Public
 */

export const getConversations = catchAsync(async (req, res) => {
    const startTime = Date.now();

    const conversations = await findAllConversations();

    const duration = Date.now() - startTime;

    logger.info('Conversations fetched successfully', {
        count: conversations.length,
        duration: `${duration}ms`
    });

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
    const startTime = Date.now();

    // ✅ Log request with context
    logger.info('Fetching conversation by ID', {
        conversationId,
        userId: req.user?._id || req.user?.id,
        limit,
        before
    });

    const conversation = await findConversationById(conversationId);

    let beforeMessage = null;
    if (before) {
        const msg = await findMessagesByConversation(conversation, { _id: before }, 1);
        beforeMessage = msg[0];
    }

    const messageQuery = {};
    if (beforeMessage) messageQuery.createdAt = { $lt: beforeMessage.createdAt };

    const messages = await findMessagesByConversation(conversation, messageQuery, parseInt(limit));

    const conversationWithMessages = { ...conversation, messages };
    const duration = Date.now() - startTime;

    logger.info('Conversation fetched successfully', {
        conversationId,
        messageCount: messages.length,
        duration: `${duration}ms`
    });

    // ✅ Log success with metrics
    logger.info('Conversation fetched successfully', {
        conversationId,
        messageCount: messages.length,
        duration: `${duration}ms`
    });

    return sendResponse(res, { 
        ...STATUS_MESSAGES.SUCCESS.FETCH, 
        data: conversationWithMessages 
    }, 'Conversation');
});

/**
 * Get all conversations for a user
 * @route GET /api/conversations/user/:userId
 * @access Private
 */
export const getConversationsByUser = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const startTime = Date.now();

    logger.info('Fetching conversations for user', {
        userId,
        requestedBy: req.user?._id || req.user?.id
    });

    const conversations = await findConversationsByUser(userId);
    const transformedConversations = transformConversationsForUser(conversations, userId);

    const duration = Date.now() - startTime;

    logger.info('User conversations fetched successfully', {
        userId,
        count: conversations.length,
        duration: `${duration}ms`
    });

    return sendResponse(res, {
        ...STATUS_MESSAGES.SUCCESS.FETCH,
        data: transformedConversations
    }, 'Conversations');
});