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

        if (!conversation) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, 'Conversation')
        }

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: conversation }, 'Conversations')

    } catch (error) {
        console.error('Error fetching Conversation: ', error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false })
    }
}

export const getConversationsByUser = async (req, res) => {
    const { userId } = req.params;

    try {
        let conversations = await Conversation.find({ users: userId }).populate('users', 'name email profilePicture').lean();;

        conversations = conversations.map(convo => {
            const receiver = convo.users.find(user => user._id.toString() !== userId)

            if (receiver.profilePicture) {
                receiver.profilePicture = receiver.profilePicture.replace(/\\/g, '/');
                receiver.profilePicture = `profile_pictures/${receiver.profilePicture.split('/').pop()}`;
            } else {
                receiver.profilePicture ='profile_pictures/default.jpg';
            }
            return {
                ...convo,
                receiver, // this is the "other" user in the conversation
            }
        })

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: conversations }, 'Conversations')

    } catch (error) {
        console.error('Error fetching Conversation: ', error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false })
    }
}