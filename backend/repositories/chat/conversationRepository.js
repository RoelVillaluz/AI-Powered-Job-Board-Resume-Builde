import Conversation from "../../models/chat/conversationModel.js";
import Message from "../../models/chat/messageModel.js";

export const findAllConversations = async () => {
  return Conversation.find({}).lean();
};

export const findConversationById = async (id) => {
  return Conversation.findById(id)
    .populate('users', 'firstName lastName email profilePicture')
    .lean();
};

export const findConversationsByUser = async (userId) => {
  return Conversation.find({ users: userId })
    .populate('users', 'firstName lastName email profilePicture')
    .populate({
      path: 'messages',
      options: { limit: 50, sort: { createdAt: -1 } },
      select: '_id sender content createdAt updatedAt seen seenAt attachment isPinned',
      populate: [
        { path: 'sender', select: 'firstName lastName profilePicture' },
        { path: 'attachment', select: 'url fileName type fileSize' },
      ],
    })
    .lean();
};

export const findMessagesByConversation = async (conversation, messageQuery = {}, limit = 20) => {
  return await Message.find({ _id: { $in: conversation.messages }, ...messageQuery })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'firstName lastName')
    .populate('attachment', 'fileName fileSize url type')
    .select('_id sender content createdAt updatedAt seen seenAt attachment isPinned')
    .lean();
};
