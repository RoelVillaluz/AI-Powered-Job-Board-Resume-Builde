import { transformAttachmentUrl, transformProfilePictureUrl } from "./urlTransformers.js";

/**
 * Transform a single message
 * @param {Object} message - Message object from database
 * @returns {Object} Transformed message
 */
export const transformMessage = (message) => {
    // Transform sender's profile picture
    if (message.sender?.profilePicture !== undefined) {
        message.sender.profilePicture = transformProfilePictureUrl(
            message.sender.profilePicture
        );
    }
    
    // Transform attachment URL
    if (message.attachment) {
        message.attachment = transformAttachmentUrl(message.attachment);
    }
    
    return message;
};

/**
 * Transform multiple messages
 * @param {Array} messages - Array of message objects
 * @returns {Array} Array of transformed messages
 */
export const transformMessages = (messages) => {
    return messages.map(transformMessage);
};