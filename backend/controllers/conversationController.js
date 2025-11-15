import Conversation from '../models/conversationModel.js'
import { STATUS_MESSAGES, sendResponse } from '../constants.js';

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

export const getConversationById = async (req, res) => {
    const { conversationId } = req.params;

    try {
        const conversation = await Conversation.findById(conversationId)
                .populate('users', 'name email')
                .populate({
                    path: 'messages',
                    select: '_id sender content createdAt updatedAt seen seenAt attachment isPinned',
                    populate: [
                        {
                            path: 'sender',
                            select: 'name'
                        },
                        {
                            path: 'attachment',
                            select: 'fileName fileSize url type'
                        }
                    ]
                })

        if (!conversation) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, 'Conversation')
        }

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: conversation }, 'Conversations')

    } catch (error) {
        console.error('Error fetching Conversation: ', error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false })
    }
}

export const getFilesByConversationId = async (req, res) => {
    const { conversationId } = req.params;

    try {
        const conversation = await Conversation.findById(conversationId).populate({
            path: "messages",
            populate: { path: "attachment" }
        })

        if (!conversation) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, 'Conversation')
        }

        const messagesWithFiles = conversation.messages.filter(msg => msg.attachment !== '' && msg.attachment !== null)

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: messagesWithFiles }, 'Conversation')
    } catch (error) {
        console.error(`Error fetching messages with attachments for conversation: ${conversationId}`)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false })
    }
}

export const getConversationsByUser = async (req, res) => {
    const { userId } = req.params;

    try {
        let conversations = await Conversation.find({ users: userId })
            .populate('users', 'name email profilePicture')
            .populate({
                path: 'messages',
                select: '_id sender content createdAt updatedAt seen seenAt attachment isPinned',
                populate: [
                    {
                        path: 'sender',
                        select: 'name profilePicture'  
                    },
                    {
                        path: 'attachment',
                        select: 'url fileName type fileSize'
                    }
                ]
            })
            .lean();

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
                    // Handle case where attachment might be a string (shouldn't happen with proper schema)
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

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: conversations }, 'Conversations');

    } catch (error) {
        console.error('Error fetching Conversation: ', error);
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false });
    }
};