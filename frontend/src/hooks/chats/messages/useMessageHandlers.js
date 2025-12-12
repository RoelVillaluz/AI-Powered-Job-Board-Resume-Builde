import { useCallback } from "react";
import * as messageService from '../../../services/messageServices.js';
import { useChatSelection, useChatState } from "../../../contexts/chats/ChatContext.jsx";

export const useMessageHandlers = ({ 
    baseUrl, 
    user, 
    socket, 
    currentConversation,
    setMessages,
    addMessageToGroups,
    updateMessageInGroups,
    deleteMessageFromGroups,
    updateConversationsList
}) => {
    const { setEditMode } = useChatState();
    const { setSelectedMessage } = useChatSelection();

    // Generic API call handler
    const handleMessageApiCall = useCallback(async (apiCall, ...args) => {
        try {
            const response = await apiCall(...args);
            return response.data.data;
        } catch (error) {
            console.error("Error in message operation:", error);
            throw error;
        }
    }, []);

    // Emit socket event
    const emitSocketEvent = useCallback((eventType, message, receiverId) => {
        if (socket) {
            socket.emit(eventType, {
                ...message,
                receiverId
            });
        }
    }, [socket]);

    // Send message
    const handleFormSubmit = useCallback(async (formData) => {
        if ((!formData.content.trim() && !formData.attachment) || !formData.receiver) {
            console.error('Cannot send message: missing content or receiver');
            return;
        }

        try {
            let submitData;
            let config = {};
            let previewAttachment = null;

            if (formData.attachment) {
                if (formData.attachment.type.startsWith('image/')) {
                    previewAttachment = URL.createObjectURL(formData.attachment);
                }

                submitData = new FormData();
                submitData.append('sender', formData.sender);
                submitData.append('receiver', formData.receiver);
                submitData.append('content', formData.content);
                submitData.append('attachment', formData.attachment);
            } else {
                submitData = {
                    sender: formData.sender,
                    receiver: formData.receiver,
                    content: formData.content
                };
                config.headers = { 'Content-Type': 'application/json' };
            }
            
            const tempMessage = {
                _id: `temp-${Date.now()}`,
                sender: {
                    _id: user._id,
                    name: user.name,
                    profilePicture: user.profilePicture
                },
                receiver: formData.receiver,
                content: formData.content,
                attachment: previewAttachment || null,
                attachmentName: formData.attachment?.name || null,
                attachmentType: formData.attachment?.type || null,
                createdAt: new Date().toISOString(),
                seen: false,
                isTemp: true
            };

            if (currentConversation) {
                setMessages(addMessageToGroups(tempMessage, user.name, user.profilePicture, user._id));
            }

            const newMessage = await handleMessageApiCall(
                messageService.sendMessage,
                baseUrl,
                submitData,
                config
            );

            if (newMessage.attachment && newMessage.attachment.includes('public')) {
                newMessage.attachment = '/' + newMessage.attachment.split('public\\').pop().replace(/\\/g, '/');
            }

            if (currentConversation) {
                setMessages((prevGroups) => {
                    return prevGroups.map(group => ({
                        ...group,
                        messages: group.messages.map(m =>
                            m._id === tempMessage._id ? newMessage : m
                        )
                    }));
                });
            }

            emitSocketEvent('send-message', newMessage, formData.receiver);
            updateConversationsList(newMessage);

            if (previewAttachment) {
                URL.revokeObjectURL(previewAttachment);
            }

            return newMessage;
        } catch (error) {
            console.error("Error sending message: ", error);
            
            if (currentConversation) {
                setMessages((prevGroups) => 
                    prevGroups
                        .map(group => ({
                            ...group,
                            messages: group.messages.filter(m => !m.isTemp)
                        }))
                        .filter(group => group.messages.length > 0)
                );
            }
            
            throw error;
        }
    }, [currentConversation, baseUrl, user, emitSocketEvent, addMessageToGroups, updateConversationsList, handleMessageApiCall, setMessages]);

    // Edit message
    const handleEditMessage = useCallback(async (message, content) => {
        try {
            const updatedMessage = await handleMessageApiCall(
                messageService.editMessage,
                baseUrl,
                message._id,
                { content }
            );

            const receiverId = updatedMessage.receiver?._id || updatedMessage.receiver || message.receiver?._id || message.receiver;
            
            emitSocketEvent("update-message", updatedMessage, receiverId);
            setMessages(updateMessageInGroups(message._id, content));
            updateConversationsList(updatedMessage, { isEdit: true });
            setEditMode(false);
        } catch (error) {
            console.error("Error editing message: ", error);
        }
    }, [baseUrl, emitSocketEvent, updateMessageInGroups, updateConversationsList, setEditMode, handleMessageApiCall, setMessages]);

    // Delete message
    const handleDeleteMessage = useCallback(async (message) => {
        try {
            const deletedMessage = await handleMessageApiCall(
                messageService.deleteMessage,
                baseUrl,
                message._id
            );

            const receiverId = deletedMessage.receiver?._id || deletedMessage.receiver || message.receiver?._id || message.receiver;
            
            emitSocketEvent("delete-message", deletedMessage, receiverId);
            setMessages(deleteMessageFromGroups(message._id));
            updateConversationsList(deletedMessage, { isDelete: true });
            setSelectedMessage(null);
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    }, [baseUrl, emitSocketEvent, deleteMessageFromGroups, updateConversationsList, setSelectedMessage, handleMessageApiCall, setMessages]);

    // Pin message
    const handlePinMessage = useCallback(async (message) => {
        try {
            const messageToPin = await handleMessageApiCall(
                messageService.pinMessage,
                baseUrl,
                message._id
            );
            
            updateConversationsList(messageToPin, { isPinUpdate: true });
            setSelectedMessage(null);
        } catch (error) {
            console.error('Error pinning/unpinning message', error);
        }
    }, [baseUrl, updateConversationsList, setSelectedMessage, handleMessageApiCall]);

    return {
        handleFormSubmit,
        handleEditMessage,
        handleDeleteMessage,
        handlePinMessage
    };
};