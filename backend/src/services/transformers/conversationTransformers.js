import { transformMessages } from './messageTransformers.js';
import { transformProfilePictureUrl } from './urlTransformers.js';

/**
 * Get the other user in a conversation (the receiver)
 * @param {Object} conversation - Conversation object with populated users
 * @param {string} currentUserId - ID of current user
 * @returns {Object|null} The other user or null
 */
export const getReceiver = (conversation, currentUserId) => {
    if (!conversation.users || conversation.users.length === 0) {
        return null;
    }
    
    return conversation.users.find(
        user => user._id.toString() !== currentUserId.toString()
    ) || null;
};

/**
 * Transform user profile data
 * @param {Object} user - User object
 * @returns {Object} Transformed user
 */
export const transformUser = (user) => {
    if (!user) return null;
    
    return {
        ...user,
        profilePicture: transformProfilePictureUrl(user.profilePicture)
    };
};

/**
 * Transform a single conversation for a specific user
 * @param {Object} conversation - Conversation object from database
 * @param {string} userId - Current user's ID
 * @returns {Object} Transformed conversation with receiver info
 */
export const transformConversationForUser = (conversation, userId) => {
    // Find and transform receiver
    const receiver = getReceiver(conversation, userId);
    const transformedReceiver = transformUser(receiver);
    
    // Transform messages if they exist
    if (conversation.messages && conversation.messages.length > 0) {
        conversation.messages = transformMessages(conversation.messages);
    }
    
    return {
        ...conversation,
        receiver: transformedReceiver
    };
};

/**
 * Transform multiple conversations for a specific user
 * @param {Array} conversations - Array of conversation objects
 * @param {string} userId - Current user's ID
 * @returns {Array} Array of transformed conversations
 */
export const transformConversationsForUser = (conversations, userId) => {
    return conversations.map(convo => 
        transformConversationForUser(convo, userId)
    );
};