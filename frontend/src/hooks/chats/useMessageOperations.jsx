import { useState, useEffect, useCallback } from "react";
import * as messageService from '../../services/messageServices.js';
import { groupMessages, shouldGroupByTime } from "../../components/utils/messageUtils.js";
import { useChatSelection, useChatState } from "../../contexts/ChatContext.jsx";
import { formatDate } from "../../components/utils/dateUtils.js";

export const useMessageOperations = ({ baseUrl, user, socket, currentConversation, setConversations }) => {
    const { setEditMode } = useChatState();
    const { setSelectedMessage } = useChatSelection();

    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (currentConversation?.receiver?._id) {
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

    const updateMessageSeenStatus = useCallback((messageIds, seenStatus = true, seenAt = null) => {
        return (prevGroups) => prevGroups.map(group => ({
            ...group,
            messages: group.messages.map(m => messageIds.includes(m._id) ? { ...m, seen: seenStatus, seenAt: seenAt } : m)
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

    const updateConversationsList = useCallback((messageData, isEdit = false, isDelete = false, isSeenUpdate = false, seenAt = null) => {
        if (!currentConversation?._id) return;

        setConversations(prevConvos => {
            const updatedConvos = prevConvos.map(convo =>
                convo._id === currentConversation._id
                    ? {
                        ...convo,
                        messages: isDelete
                            ? convo.messages.filter(msg => msg._id !== messageData._id)
                            : isEdit
                                ? convo.messages.map(msg =>
                                    msg._id === messageData._id
                                        ? { ...msg, content: messageData.content }
                                        : msg
                                )
                                : isSeenUpdate
                                    ? convo.messages.map(msg =>
                                        // messageData should be an array of message IDs for seen updates
                                        Array.isArray(messageData) && messageData.includes(msg._id)
                                            ? { ...msg, seen: true, seenAt: seenAt }
                                            : msg
                                    )
                                    : [...convo.messages, messageData]
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

    // MODIFIED: Accept formData as parameter instead of using context
    const handleFormSubmit = useCallback(async (formData) => {
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
        } catch (error) {
            console.error("Error sending message: ", error);
        }
    }, [currentConversation, baseUrl, user, emitSocketEvent, addMessageToGroups, updateConversationsList, handleMessageApiCall]);

    // MODIFIED: Accept message and content as parameters
    const handleEditMessage = useCallback(async (message, content) => {
        try {
            const updatedMessage = await handleMessageApiCall(
                messageService.editMessage,
                baseUrl,
                message._id,
                { content }
            );

            emitSocketEvent("update-message", updatedMessage, updatedMessage.receiver);
            setMessages(updateMessageInGroups(message._id, content));
            updateConversationsList(updatedMessage, true);
            setEditMode(false);
        } catch (error) {
            console.error("Error editing message: ", error);
        }
    }, [baseUrl, emitSocketEvent, updateMessageInGroups, updateConversationsList, setEditMode, handleMessageApiCall]);

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

        const handleMessagesSeen = (data) => {
            const { messageIds, seenBy, seenAt } = data;

            setMessages(updateMessageSeenStatus(messageIds, true, seenAt));
            updateConversationsList(messageIds, false, false, true, seenAt)
        }

        socket.on("new-message", handleNewMessage);
        socket.on("update-message", handleUpdateMessage);
        socket.on("delete-message", handleDeleteMessage);
        socket.on("messages-seen", handleMessagesSeen);

        return () => {
            socket.off("new-message", handleNewMessage);
            socket.off("update-message", handleUpdateMessage);
            socket.off("delete-message", handleDeleteMessage);
            socket.off("messages-seen", handleMessagesSeen);
        };
    }, [socket, currentConversation, user._id, updateConversationsList, addMessageToGroups, updateMessageInGroups, deleteMessageFromGroups, updateMessageSeenStatus]);

    return {
        messages,
        setMessages,
        handleFormSubmit,
        handleEditMessage,
        handleDeleteMessage
    };
};

export default useMessageOperations;