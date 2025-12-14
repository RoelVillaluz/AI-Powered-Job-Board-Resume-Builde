import { UnauthorizedError } from '../errorHandler.js';
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
    
    // Check if user is part of conversation
    const isParticipant = conversation.users.some(
        user => user.toString() === userId.toString()
    );

    if (!isParticipant) {
        throw new UnauthorizedError('Access denied to this conversation');
    }
    
    next();
})

export const authorizeConversationByUserId = catchAsync(async (req, res, next) => {
    const userId = req.user._id; // logged-in user
    const { userId: paramUserId } = req.params; // userId from URL

    if (userId.toString() !== paramUserId.toString()) {
        throw new UnauthorizedError('Access denied to this user\'s conversations');
    }

    next();
});
