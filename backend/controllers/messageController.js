import mongoose, { mongo } from 'mongoose'
import Message from '../models/messageModel.js'
import Conversation from '../models/conversationModel.js'
import { STATUS_MESSAGES, sendResponse } from '../constants.js'
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
    const requiredFields = ["sender", "receiver"];

    try {
        const missingField = checkMissingFields(requiredFields, messageData);
        if (missingField) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.MISSING_FIELD(missingField), success: false }, 'Message');
        }

        // NEW: Validate that at least one of content or attachment exists
        if ((!messageData.content || !messageData.content.trim()) && !messageData.attachment) {
            return sendResponse(
                res, 
                { message: 'Either content or attachment is required', success: false }, 
                'Message'
            );
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
            content: messageData.content,
            attachment: messageData.attachment || null
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

export const updateMessage = async (req, res) => {
    const { messageId } = req.params;
    const { content } = req.body;
    
    try {
        const updatedMessage = await Message.findOneAndUpdate(
            { _id: messageId },
            {
                $set: {
                    content: content,
                    updatedAt: new Date()
                }
            },
            { new: true }
        );

        if (!updatedMessage) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, 'Message');
        }
        

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.UPDATE, data: updatedMessage }, 'Message');
    } catch (error) {
        console.error('Error updating message: ', error);
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false });
    }
}

export const markMessagesAsSeen = async (req, res) => {
    const { messageIds, userId } = req.body;

    try {
        console.log('Received req.body:', req.body);

        if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.INVALID_INPUT, success: false})
        }

        // Update multiple messages in a single query
        const result = await Message.updateMany(
            {
                _id: { $in: messageIds },
                sender: { $ne: userId }, // Don't mark own messages as seen
                seen: { $ne: true }
            },
            {
                $set: {
                    seen: true,
                    seenAt: new Date()
                },
            }
        )

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.UPDATE, data: result }, 'Messages')
    } catch (error) {
        console.error('Error: ', error)
    }
}

export const deleteMessage = async (req, res) => {
    const { messageId } = req.params;

    try {
        const deletedMessage = await Message.findOneAndDelete({ _id: messageId })
        if (!deletedMessage) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, 'Message')
        }

        const conversation = await Conversation.findOne({ messages: messageId })

        if (conversation) {
            await Conversation.updateOne(
                { _id: conversation._id },
                { $pull: { messages: messageId }}
            )
        }

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.DELETE, data: deletedMessage }, 'Message')
    } catch (error) {
        console.error(error)
    }
}