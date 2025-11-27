import mongoose, { mongo } from 'mongoose'
import Message from '../models/messageModel.js'
import Conversation from '../models/conversationModel.js'
import Attachment from '../models/attachmentModel.js'
import { STATUS_MESSAGES, sendResponse } from '../constants.js'
import { checkMissingFields, determineFileType } from '../utils.js'
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

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
        // Check for missing required fields
        const missingField = checkMissingFields(requiredFields, messageData);
        if (missingField) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.MISSING_FIELD(missingField), success: false }, 'Message');
        }

        // Require either content or attachment
        if ((!messageData.content || !messageData.content.trim()) && !req.file) {
            return sendResponse(
                res, 
                { message: 'Either content or attachment is required', success: false }, 
                'Message'
            );
        }

        // Validate sender and receiver IDs
        const senderId = messageData.sender?.id || messageData.sender;
        const receiverId = messageData.receiver?.id || messageData.receiver;

        if (!mongoose.Types.ObjectId.isValid(senderId)) {
            return res.status(400).json({ message: 'Invalid sender ID format', success: false });
        }

        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({ message: 'Invalid receiver ID format', success: false });
        }

        const participantIds = [senderId, receiverId];

        // Find existing conversation between participants
        let conversation = await Conversation.findOne({
            users: { $all: participantIds },
            $expr: { $eq: [{ $size: "$users" }, participantIds.length] }
        });

        // Create new conversation if it doesn't exist
        if (!conversation) {
            conversation = new Conversation({ users: participantIds });
            await conversation.save();
        }

        // Handle attachment
        let attachmentDoc = null;
        if (req.file) {
            const inputPath = req.file.path;
            const outputPath = inputPath.replace(/\.\w+$/, '.webp');

            await sharp(inputPath).webp({ quality: 80 }).toFile(outputPath);
            fs.unlinkSync(inputPath); // Delete original file

            attachmentDoc = await Attachment.create({
                fileName: path.basename(outputPath),
                fileSize: fs.statSync(outputPath).size,
                url: outputPath,
                type: determineFileType(req.file.mimetype)
            });
        }

        // Create message with conversation field
        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            conversation: conversation._id, // <-- set conversation here
            content: messageData.content,
            attachment: attachmentDoc?._id || null
        });

        await newMessage.save();

        // Push message into conversation
        conversation.messages.push(newMessage._id);
        await conversation.save();

        // Populate message for response
        const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender', 'name profilePicture')
            .populate('receiver', 'name profilePicture')
            .populate('attachment');

        // Transform attachment URL for frontend
        if (populatedMessage.attachment && typeof populatedMessage.attachment.url === 'string') {
            if (populatedMessage.attachment.url.includes('public')) {
                populatedMessage.attachment.url = '/' + populatedMessage.attachment.url.split('public\\').pop().replace(/\\/g, '/');
            }
        }

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.CREATE, data: populatedMessage }, 'Message');
    } catch (error) {
        console.error('Error creating message:', error);
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

export const pinMessage = async (req, res) => {
    const { messageId } = req.params;

    try {
        const messageToPin = await Message.findById(messageId);

        if (!messageToPin) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, 'Message')
        }

        messageToPin.isPinned = !messageToPin.isPinned

        await messageToPin.save()

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.PINNED_MESSAGE, data: messageToPin }, 'Message' )
    } catch (error) {
        console.error('Error pinning message: ', error)
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