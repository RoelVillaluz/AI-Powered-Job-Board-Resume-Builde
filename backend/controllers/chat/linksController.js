import Conversation from '../../models/chat/conversationModel.js';
import Message from '../../models/chat/messageModel.js';
import { STATUS_MESSAGES, sendResponse } from '../../constants.js';
import mongoose from 'mongoose';

export const getLinkCountsByConversationId = async (req, res) => {
    const { conversationId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return sendResponse(res, {
                ...STATUS_MESSAGES.ERROR.BAD_REQUEST,
                message: "Invalid conversationId",
                success: false
            }, 'Conversation');
        }

        const conversation = await Conversation.findById(conversationId).select('messages');
        if (!conversation) {
            return sendResponse(res, { 
                ...STATUS_MESSAGES.ERROR.NOT_FOUND, 
                success: false 
            });
        }

        // Handle aggregation at database level for even better optimization
        const result = await Message.aggregate([
            { $match: { _id: { $in: conversation.messages } } },
            { $project: {
                links: {
                    $regexFindAll: {
                        input: "$content",
                        regex: "\\b((https?:\\/\\/)?(www\\.)?[a-zA-Z0-9\\-._~%]+\\.[a-zA-Z]{2,}(\\/[^\\s]*)?)",
                        options: "i"
                    }
                }
            }},
            { $project: { linkCount: { $size: "$links" } } },
            { $group: { _id: null, totalLinks: { $sum: "$linkCount" } } }
        ]);

        const count = result.length > 0 ? result[0].totalLinks : 0;

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: { count: count }}, 'Conversation');
    } catch (error) {
        console.error(`Error fetching links count for conversation: ${conversationId}`, error);
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false });
    }
}

export const getLinksByConversationId = async (req, res) => {
    const { conversationId } = req.params;
    const { page = 1, limit = 5} = req.query;

    try {
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return sendResponse(res, {
                ...STATUS_MESSAGES.ERROR.BAD_REQUEST,
                message: "Invalid conversationId",
                success: false
            }, 'Conversation');
        }

        // URL regex pattern as STRING for MongoDB
        const urlPattern = '\\b((https?:\\/\\/)?(www\\.)?[a-zA-Z0-9\\-._~%]+\\.[a-zA-Z]{2,}(\\/[^\\s]*)?)';

        const conversation = await Conversation.findById(conversationId).select('messages');

        if (!conversation) {
            return sendResponse(res, { 
                ...STATUS_MESSAGES.ERROR.NOT_FOUND, 
                success: false 
            }, 'Conversation');
        }

        const totalMessages = await Message.countDocuments({
            _id: { $in: conversation.messages },
            content: { $regex: urlPattern, $options: 'i' }
        })

        // Fetch paginated messages
        const skip = (page - 1) * limit;

        const messages = await Message.find({
            _id: { $in: conversation.messages },
            content: { $regex: urlPattern, $options: 'i' }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('sender', 'name profilePicture')
        .select('content sender linkPreview createdAt')
        .lean()
        
        return sendResponse(res, { 
            ...STATUS_MESSAGES.SUCCESS.FETCH, 
            data: {
                messages,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalMessages / limit),
                    totalItems: totalMessages,
                    itemsPerPage: parseInt(limit),
                    hasMore: skip + messages.length < totalMessages
                }
            }
        }, 'Conversation');
        
    } catch (error) {
        console.error(`Error fetching messages with links for conversation: ${conversationId}`, error);
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false });
    }
}