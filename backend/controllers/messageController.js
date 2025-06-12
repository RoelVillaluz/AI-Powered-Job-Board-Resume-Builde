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


export const createMessage = async (req, res) => {
    const messageData = req.body;
    const requiredFields = ["sender", "receiver", "content"];

    try {
        const missingField = checkMissingFields(requiredFields, messageData);
        if (missingField) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.MISSING_FIELD(missingField), success: false }, 'Message');
        }

        // Validate and extract sender ID
        const senderId = messageData.sender?.id || messageData.sender;
        if (!mongoose.Types.ObjectId.isValid(senderId)) {
            console.error('Invalid sender ID:', senderId);
            return res.status(400).json({ message: 'Invalid sender ID format', success: false });
        }

        // Validate receiver ID
        const receiverId = messageData.receiver?.id || messageData.receiver;
        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
            console.error('Invalid receiver ID:', receiverId);
            return res.status(400).json({ message: 'Invalid receiver ID format', success: false });
        }

        // Check if conversation exists
        const participantIds = [senderId, receiverId];

        const existingConversation = await Conversation.findOne({
            users: { $all: participantIds },
            $expr: { $eq: [{ $size: "$users" }, participantIds.length] }
        });

        let conversation;
        if (!existingConversation) {
            conversation = new Conversation({ users: participantIds });
            await conversation.save();
        } else {
            conversation = existingConversation;
        }

        const newMessage = new Message({
            ...messageData,
            sender: new mongoose.Types.ObjectId(senderId), // corrected userId to senderId
            receiver: new mongoose.Types.ObjectId(receiverId),
            content: content
        });

        await newMessage.save();

        // Add message to conversation
        conversation.messages.push(newMessage._id);
        await conversation.save();

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.CREATE, data: newMessage }, 'Message'); // corrected response
    } catch (error) {
        console.error('Error', error);
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false });
    }
};
