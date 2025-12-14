import { UnauthorizedError, NotFoundError } from '../errorHandler.js';
import { catchAsync } from '../../utils/errorUtils.js';
import Conversation from '../../models/chat/conversationModel.js';

// Authorization - check if user owns the conversation
export const authorizeConversation = catchAsync(async (req, res, next) => {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
        throw new NotFoundError('Conversation');
    }

    // Defensive check
    if (!conversation.users || !Array.isArray(conversation.users) || conversation.users.length === 0) {
        throw new UnauthorizedError('Invalid conversation data');
    }

    const isParticipant = conversation.users.some(
        user => user?.toString() === userId.toString()
    );

    if (!isParticipant) {
        throw new UnauthorizedError('Access denied to this conversation');
    }

    next();
});

export const authorizeConversationByUserId = catchAsync(async (req, res, next) => {
    const userId = req.user._id || req.user.id; // 🔹 use id if _id doesn't exist
    const { userId: paramUserId } = req.params; 

    if (!userId) {
        throw new UnauthorizedError('Invalid authentication data');
    }

    if (userId.toString() !== paramUserId.toString()) {
        throw new UnauthorizedError('Access denied to this user\'s conversations');
    }

    next();
});

