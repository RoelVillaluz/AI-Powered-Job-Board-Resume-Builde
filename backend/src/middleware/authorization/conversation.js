import { UnauthorizedError, NotFoundError } from '../errorHandler.js';
import { catchAsync } from '../../utils/errorUtils.js';
import Conversation from '../../models/chat/conversationModel.js';

// Authorization - check if user owns the conversation
export const authorizeConversation = catchAsync(async (req, res, next) => {
    const { conversationId } = req.params;
    const userId = req.user?._id || req.user?.id;

    if (!userId) throw new UnauthorizedError('Invalid authentication data');

    const conversation = await Conversation.findById(conversationId).select('users');

    if (!conversation) throw new NotFoundError('Conversation');

    // Defensive check
    if (!Array.isArray(conversation.users) || conversation.users.length === 0) {
        throw new ForbiddenError('Invalid conversation data'); 
    }

    const isParticipant = conversation.users.some(
        u => u?._id?.toString?.() === userId.toString() || u?.toString?.() === userId.toString()
    );

    if (!isParticipant) {
        throw new ForbiddenError('You are not part of this conversation');
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
        throw new ForbiddenError('You can only access your own conversations'); 
    }

    next();
});

