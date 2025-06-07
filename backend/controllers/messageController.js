import Message from '../models/messageModel.js'
import Conversation from '../models/conversationModel.js'
import { STATUS_MESSAGES } from '../constants.js'
import { checkMissingFields } from '../utils.js'

export const getMessages = async (req, res) => {
    try {
        const messages = await Message.find({})

        if (!messages) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, 'Messages')
        }

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: messages }, 'Messages')
    } catch (error) {
        console.error('Error fetching messages: ', error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false })
    }
}

export const getMessageById = async (req, res) => {
    const { messageId } = req.params;
    
    try {
        const message = await Message.findById(messageId)

        if (!message) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, 'Message')
        }

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: message }, 'Message')

    } catch (error) {
        console.error('Error fetching message: ', error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false })
    }
}

export const getMessagesByUser = async (req, res) => {
    const { userId } = req.params;

    try {
        const messages = await Message.find({ sender: userId })

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: messages }, 'Messages')

    } catch (error) {
        console.error('Error fetching messages: ', error)
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false })
    }
}
