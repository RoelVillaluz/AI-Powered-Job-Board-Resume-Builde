import { useState, useEffect, useCallback } from "react";
import * as messageService from '../../services/messageServices.js';
import { groupMessages, shouldGroupByTime } from "../../components/utils/messageUtils.js";

export const useMessageOperations = (
    { 
        baseUrl,
        user,
        socket,
        currentConversation,
        setConversations,
        editMode,
        setEditMode,
        selectedMessage,
        setSelectedMessage
    }) => {

    const [messages, setMessages] = useState([]);
    const [formData, setFormData] = useState(() => ({
        sender: user._id,
        receiver: currentConversation?.receiver?._id || '',
        content: '',
    }));

    // Load conversation messages when switching conversations
    useEffect(() => {
        if (currentConversation?.receiver?._id) {
            setFormData(prev => ({
            ...prev,
            receiver: currentConversation.receiver._id
            }));
            setMessages(groupMessages(currentConversation.messages));
        }
    }, [currentConversation]);

    // Handle input changes
    const handleChange = useCallback((name, value) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    }, [])

    // Update conversations list when a message is sent/edited
    const updateConversationsList = useCallback((newMessage, isEdit = false) => {
        if (!currentConversation?._id) return;

        setConversations((prevConvos) => {
            const updatedConvos = prevConvos.map(convo => 
                convo._id === currentConversation
                ? {
                    ...convo,
                    messages: isEdit 
                        ? convo.messages.map(msg => 
                            msg._id === newMessage._id ? { ...msg, content: newMessage.content } : msg
                    )
                    : [...convo.messages, newMessage]
                } : convo
            );

            return [...updatedConvos].sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.messages.at(-1)?.createdAt || 0)
                const dateB = new Date(b.updatedAt || b.messages.at(-1)?.createdAt || 0)
                return dateB - dateA
            });
        });
    }, [currentConversation?._id, setConversations])

    // Send Message
    const handleFormSubmit = useCallback(async (e) => {
        if (e) e.preventDefault;
        if (!formData.content.trim()) return;
        if (!currentConversation) return;

        try {
            const response = await messageService.sendMessage(baseUrl, formData)
            const newMessage = response.data.data;

            console.log(`New message sent to ${currentConversation.receiver.name}: `, response.data.data);

            // Emit the message to the server for real-time delivery
            if (socket) {
                socket.emit('send-message', {
                    ...newMessage,
                    receiverId: formData.receiver
                })
            }

            // Optimistically add new message locally to message groups
            setMessages((prevGroups) => {
                const lastGroup = prevGroups[prevGroups.length - 1]

                if (
                        lastGroup && 
                        lastGroup.sender === user.name &&
                        shouldGroupByTime(lastGroup.rawDateTime, newMessage.createdAt)
                ) {
                    // Append to existing group
                    const updatedGroups = [...prevGroups]
                    updatedGroups[updatedGroups.length - 1] = {
                        ...lastGroup,
                        messages: [...lastGroup.messages, newMessage],
                        rawDateTime: newMessage.createdAt
                    };
                    return updatedGroups
                } else {
                    // Create new message group
                    return [
                        ...prevGroups,
                        {
                            sender: user.name,
                            profilePicture: user.profilePicture, // assuming this exists
                            createdAt: messageUtils.formatDate(newMessage.createdAt),
                            rawDateTime: newMessage.createdAt,
                            messages: [newMessage]
                        }
                    ]
                }

            })

            updateConversationsList(newMessage)
            handleChange("content", "");
        } catch (error) {
            console.error('Error sending message: ', error)
        }
    })

    const handleEditMessage = useCallback(async(message) => {
        try {
            console.log('Message to edit: ', message)
            const response = await messageService.editMessage(baseUrl, message._id, {
                content: formData.content
            })

            const updatedMessage = response.data.data;

            // Emit the update to the server for real-time delivery
            if (socket) {
                socket.emit('update-message', {
                    ...updatedMessage,
                    receiverId: currentConversation.receiver._id
                })
            }

            setMessages((prevGroups) => 
                prevGroups.map((group) => ({
                    ...group,
                    messages: group.messages.map((m) => m._id === message._id ? { ...m, content: formData.content } : m)
                }))
            )

            console.log("Edited message: ", response.data.data)

            updateConversationsList(updatedMessage, true)
            setEditMode(false)
            setFormData((prev) => ({
                ...prev,
                content: ''
            }))
        } catch (error) {
            console.log('Error editing message: ', message)
        }
    }, [formData.content, baseUrl, socket, currentConversation, updateConversationsList, setEditMode]);

    // Delete message
    const handleDeleteMessage = useCallback(async(message) => {
        try {
            const response = await messageService.deleteMessage(baseUrl, message._id)
            const deletedMessage = response.data.data
            console.log('Deleted Message: ', deletedMessage)

            if (socket) {
                socket.emit('delete-message', {
                    ...deletedMessage,
                    receiverId: currentConversation.receiver._id
                })
            }

            setMessages((prevGroups) => 
                prevGroups.map((group) => ({
                    ...group,
                    messages: group.messages.filter((msg) => msg._id !== message._id)
                }))
                .filter(group => group.messages.length > 0)
            )

            setConversations(prevConvos => 
                prevConvos.map((convo) => 
                    convo._id === currentConversation._id
                    ? {
                        ...convo,
                        messages: convo.messages.filter((msg) => msg._id !== message._id)
                    } 
                    : convo
                )
            );
        
        setSelectedMessage(null);
        } catch (error) {
            console.error('Error deleting message:', error);
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
    }
}

export default useMessageOperations