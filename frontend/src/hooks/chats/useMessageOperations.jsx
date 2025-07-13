import { useState, useEffect, useCallback } from "react";
import * as messageService from '../../services/messageServices.js';
import { groupMessages, shouldGroupByTime } from "../../components/utils/messageUtils.js";
import { useChatContext } from "../../contexts/ChatContext.jsx";
import { formatDate } from "../../components/utils/dateUtils.js";

export const useMessageOperations = ({ baseUrl, user, socket, currentConversation, setConversations }) => {
    const {
        selectedMessage,
        setSelectedMessage,
        editMode,
        setEditMode,
        formData,
        setFormData,
        handleChange
    } = useChatContext();

    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (currentConversation?.receiver?._id) {
            setFormData(prev => ({
                ...prev,
                receiver: currentConversation.receiver._id
            }));
            setMessages(groupMessages(currentConversation.messages));
        }
    }, [currentConversation]);

    // Helper function to emit socket events
    const emitSocketEvent = useCallback((eventType, message, receiverId) => {
        if (socket) {
            socket.emit(eventType, {
                ...message,
                receiverId
            });
        }
    }, [socket]);

    // Helper function to add message to groups (used by both send and socket receive)
    const addMessageToGroups = useCallback((newMessage, senderName, profilePicture) => {
        return (prevGroups) => {
            const lastGroup = prevGroups[prevGroups.length - 1];
            if (lastGroup && lastGroup.sender === senderName && shouldGroupByTime(lastGroup.rawDateTime, newMessage.createdAt)) {
                const updatedGroups = [...prevGroups];
                updatedGroups[updatedGroups.length - 1] = {
                    ...lastGroup,
                    messages: [...lastGroup.messages, newMessage],
                    rawDateTime: newMessage.createdAt
                };
                return updatedGroups;
            } else {
                return [
                    ...prevGroups,
                    {
                        sender: senderName,
                        profilePicture: profilePicture,
                        createdAt: formatDate(newMessage.createdAt),
                        rawDateTime: newMessage.createdAt,
                        messages: [newMessage]
                    }
                ];
            }
        };
    }, []);

    // Helper function to update message in groups
    const updateMessageInGroups = useCallback((messageId, updatedContent) => {
        return (prevGroups) => prevGroups.map(group => ({
            ...group,
            messages: group.messages.map(m =>
                m._id === messageId ? { ...m, content: updatedContent } : m
            )
        }));
    }, []);

    // Helper function to delete message from groups
    const deleteMessageFromGroups = useCallback((messageId) => {
        return (prevGroups) => prevGroups
            .map(group => ({
                ...group,
                messages: group.messages.filter(m => m._id !== messageId)
            }))
            .filter(group => group.messages.length > 0);
    }, []);

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

    const updateConversationsList = useCallback((newMessage, isEdit = false, isDelete = false) => {
        if (!currentConversation?._id) return;

        setConversations(prevConvos => {
            const updatedConvos = prevConvos.map(convo =>
                convo._id === currentConversation._id
                    ? {
                        ...convo,
                        messages: isDelete
                            ? convo.messages.filter(msg => msg._id !== newMessage._id)
                            : isEdit
                                ? convo.messages.map(msg =>
                                    msg._id === newMessage._id
                                        ? { ...msg, content: newMessage.content }
                                        : msg
                                )
                                : [...convo.messages, newMessage]
                    }
                    : convo
            );

            return [...updatedConvos].sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.messages.at(-1)?.createdAt || 0);
                const dateB = new Date(b.updatedAt || b.messages.at(-1)?.createdAt || 0);
                return dateB - dateA;
            });
        });
    }, [currentConversation?._id, setConversations]);

    const handleFormSubmit = useCallback(async (e) => {
        if (e) e.preventDefault();
        if (!formData.content.trim() || !currentConversation) return;

        try {
            const newMessage = await handleMessageApiCall(
                messageService.sendMessage,
                baseUrl,
                formData
            );

            emitSocketEvent('send-message', newMessage, formData.receiver);
            setMessages(addMessageToGroups(newMessage, user.name, user.profilePicture));
            updateConversationsList(newMessage);
            handleChange("content", "");
        } catch (error) {
            console.error("Error sending message: ", error);
        }
    }, [formData, currentConversation, baseUrl, user, emitSocketEvent, addMessageToGroups, updateConversationsList, handleChange, handleMessageApiCall]);

    const handleEditMessage = useCallback(async (message) => {
        try {
            const updatedMessage = await handleMessageApiCall(
                messageService.editMessage,
                baseUrl,
                message._id,
                { content: formData.content }
            );

            emitSocketEvent("update-message", updatedMessage, updatedMessage.receiver);
            setMessages(updateMessageInGroups(message._id, formData.content));
            updateConversationsList(updatedMessage, true);
            setEditMode(false);
            setFormData(prev => ({ ...prev, content: "" }));
        } catch (error) {
            console.error("Error editing message: ", error);
        }
    }, [formData.content, baseUrl, emitSocketEvent, updateMessageInGroups, updateConversationsList, setEditMode, setFormData, handleMessageApiCall]);

    const handleDeleteMessage = useCallback(async (message) => {
        try {
            const deletedMessage = await handleMessageApiCall(
                messageService.deleteMessage,
                baseUrl,
                message._id
            );

            emitSocketEvent("delete-message", deletedMessage, deletedMessage.receiver);
            setMessages(deleteMessageFromGroups(message._id));
            updateConversationsList(deletedMessage, false, true);
            setSelectedMessage(null);
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    }, [baseUrl, emitSocketEvent, deleteMessageFromGroups, updateConversationsList, setSelectedMessage, handleMessageApiCall]);

    // SOCKET LISTENERS — real-time updates
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (newMessage) => {
            if (currentConversation?.receiver?._id !== newMessage.sender && currentConversation?.receiver?._id !== newMessage.receiverId) return;

            setMessages(addMessageToGroups(
                newMessage, 
                newMessage.sender, 
                currentConversation.receiver.profilePicture
            ));
            updateConversationsList(newMessage);
        };

        const handleUpdateMessage = (updatedMessage) => {
            setMessages(updateMessageInGroups(updatedMessage._id, updatedMessage.content));
            updateConversationsList(updatedMessage, true);
        };

        const handleDeleteMessage = (deletedMessage) => {
            setMessages(deleteMessageFromGroups(deletedMessage._id));
            updateConversationsList(deletedMessage, false, true);
        };

        socket.on("new-message", handleNewMessage);
        socket.on("update-message", handleUpdateMessage);
        socket.on("delete-message", handleDeleteMessage);

        return () => {
            socket.off("new-message", handleNewMessage);
            socket.off("update-message", handleUpdateMessage);
            socket.off("delete-message", handleDeleteMessage);
        };
    }, [socket, currentConversation, updateConversationsList, addMessageToGroups, updateMessageInGroups, deleteMessageFromGroups]);

    return {
        messages,
        setMessages,
        formData,
        handleChange,
        handleFormSubmit,
        handleEditMessage,
        handleDeleteMessage
    };
};

export default useMessageOperations;