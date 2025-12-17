import Message from "../models/chat/messageModel.js";

export const findMessages = async () => {
  return await Message.find({});
};

export const findMessageById = async (id) => {
  return await Message.findById(id);
};

export const findMessagesByUser = async (userId) => {
  return await Message.find({ sender: userId });
};

export const createMessage = async (data) => {
  const message = new Message(data);
  return await message.save();
};

export const updateMessage = async (id, update) => {
  return await Message.findOneAndUpdate({ _id: id }, update, { new: true });
};

export const deleteMessage = async (id) => {
  return await Message.findOneAndDelete({ _id: id });
};

export const markMessagesSeen = async (messageIds, userId) => {
  return await Message.updateMany(
    { _id: { $in: messageIds }, sender: { $ne: userId }, seen: { $ne: true } },
    { $set: { seen: true, seenAt: new Date() } }
  );
};