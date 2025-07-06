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
        setFormData
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

    const handleChange = useCallback((name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const updateConversationsList = useCallback((newMessage, isEdit = false) => {
        if (!currentConversation?._id) return;

            setConversations(prevConvos => {
            const updatedConvos = prevConvos.map(convo =>
                convo._id === currentConversation._id
                ? {
                    ...convo,
                    messages: isEdit
                        ? convo.messages.map(msg => msg._id === newMessage._id ? { ...msg, content: newMessage.content } : msg)
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
            const response = await messageService.sendMessage(baseUrl, formData);
            const newMessage = response.data.data;

            console.log(`New message sent to ${currentConversation.receiver.name}: `, newMessage);

            if (socket) {
                socket.emit('send-message', {
                ...newMessage,
                receiverId: formData.receiver
                });
            }

            setMessages(prevGroups => {
                const lastGroup = prevGroups[prevGroups.length - 1];
                if (lastGroup && lastGroup.sender === user.name && shouldGroupByTime(lastGroup.rawDateTime, newMessage.createdAt)) {
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
                    sender: user.name,
                    profilePicture: user.profilePicture,
                    createdAt: formatDate(newMessage.createdAt),
                    rawDateTime: newMessage.createdAt,
                    messages: [newMessage]
                    }
                ];
                }
            });

            updateConversationsList(newMessage);
            handleChange("content", "");
        } catch (error) {
            console.error("Error sending message: ", error);
        }
    }, [formData, currentConversation, socket, baseUrl, user, updateConversationsList, handleChange]);

    const handleEditMessage = useCallback(async (message) => {
        try {
            const response = await messageService.editMessage(baseUrl, message._id, { content: formData.content });
            const updatedMessage = response.data.data;

            if (socket) {
                socket.emit("update-message", {
                ...updatedMessage,
                receiverId: currentConversation.receiver._id
                });
            }

            setMessages(prevGroups =>
                prevGroups.map(group => ({
                ...group,
                messages: group.messages.map(m => m._id === message._id ? { ...m, content: formData.content } : m)
                }))
            );

            console.log("Edited message: ", updatedMessage);

            updateConversationsList(updatedMessage, true);
            setEditMode(false);
            setFormData(prev => ({ ...prev, content: "" }));
        } catch (error) {
            console.error("Error editing message: ", error);
        }
    }, [formData.content, baseUrl, socket, currentConversation, updateConversationsList, setEditMode]);

    const handleDeleteMessage = useCallback(async (message) => {
        try {
            const response = await messageService.deleteMessage(baseUrl, message._id);
            const deletedMessage = response.data.data;

            if (socket) {
                socket.emit("delete-message", {
                ...deletedMessage,
                receiverId: currentConversation.receiver._id
                });
            }

            setMessages(prevGroups =>
                prevGroups
                .map(group => ({
                    ...group,
                    messages: group.messages.filter(msg => msg._id !== message._id)
                }))
                .filter(group => group.messages.length > 0)
            );

            setConversations(prevConvos =>
                prevConvos.map(convo =>
                convo._id === currentConversation._id
                    ? {
                        ...convo,
                        messages: convo.messages.filter(msg => msg._id !== message._id)
                    }
                    : convo
                )
            );

            setSelectedMessage(null);
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    }, [baseUrl, socket, currentConversation, setConversations, setSelectedMessage]);

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

export default useMessageOperations