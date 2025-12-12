import { useState, useEffect, useCallback } from "react";
import * as messageService from '../../services/messageServices.js';
import { groupMessages, shouldGroupByTime } from "../../components/utils/messageUtils.js";
import { useChatSelection, useChatState } from "../../contexts/chats/ChatContext.jsx";
import { formatDate } from "../../components/utils/dateUtils.js";

export const useMessageOperations = ({ baseUrl, user, socket, currentConversation, setConversations }) => {
    const { setEditMode } = useChatState();
    const { setSelectedMessage } = useChatSelection();

    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (currentConversation?.receiver?._id) {
            // Backend returns newest first, but groupMessages expects chronological
            const messagesInChronologicalOrder = [...currentConversation.messages].reverse();
            setMessages(groupMessages(messagesInChronologicalOrder));
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

    // Fix loadOlderMessages to handle newest-first from backend
    const loadOlderMessages = async () => {
        if (messages.length === 0) return;
        
        // Get the oldest message from the first group
        const firstGroup = messages[0];
        const oldestMessage = firstGroup.messages[0];

        try {
            const response = await axios.get(`${baseUrl}/messages`, {
                params: { before: oldestMessage._id, limit: 20 },
            });

            console.log("Loading older messages...");

            const olderMessages = response.data.data || [];
            if (olderMessages.length === 0) return;
            
            // Backend returns newest-first, reverse to chronological
            const chronologicalOlder = [...olderMessages].reverse();
            
            // Smart prepending: only regroup the new messages + first existing group
            setMessages(prev => {
                if (prev.length === 0) return groupMessages(chronologicalOlder);
                
                const firstExistingGroup = prev[0];
                const lastNewMessage = chronologicalOlder[chronologicalOlder.length - 1];
                
                // Check if we can merge with existing first group
                const canMerge = 
                    firstExistingGroup.sender === (lastNewMessage.sender.firstName + ' ' + lastNewMessage.sender.lastName) &&
                    shouldGroupByTime(lastNewMessage.createdAt, firstExistingGroup.rawDateTime);
                
                if (canMerge) {
                    // Merge last new message with first existing group
                    const newGroups = groupMessages(chronologicalOlder.slice(0, -1));
                    const mergedGroup = {
                        ...firstExistingGroup,
                        messages: [lastNewMessage, ...firstExistingGroup.messages],
                        rawDateTime: lastNewMessage.createdAt
                    };
                    return [...newGroups, mergedGroup, ...prev.slice(1)];
                } else {
                    // Just prepend new groups
                    const newGroups = groupMessages(chronologicalOlder);
                    return [...newGroups, ...prev];
                }
            });
        } catch (error) {
            console.error('Failed to load older messages: ', error)
        }
    }


    // Helper function to add message to groups (used by both send and socket receive)
    const addMessageToGroups = useCallback((newMessage, senderName, profilePicture, senderId) => {
        return (prevGroups) => {
            const lastGroup = prevGroups[prevGroups.length - 1];
            if (lastGroup && lastGroup.senderId === senderId && shouldGroupByTime(lastGroup.rawDateTime, newMessage.createdAt)) {
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
                        senderId: senderId, // ✅ Add this
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

    const updateConversationsList = useCallback((messageData, options = {}) => {
        const { isEdit = false, isDelete = false, isSeenUpdate = false, isPinUpdate = false, seenAt = null } = options;
        
        // Don't require currentConversation for new conversations
        const conversationId = currentConversation?._id || messageData.conversation;
        if (!conversationId) return;

        setConversations(prevConvos => {
            const updatedConvos = prevConvos.map(convo =>
                convo._id === conversationId
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
                                        Array.isArray(messageData) && messageData.includes(msg._id)
                                            ? { ...msg, seen: true, seenAt: seenAt }
                                            : msg
                                    )
                                    : isPinUpdate
                                        ? convo.messages.map(msg =>
                                            msg._id === messageData._id
                                                ? { ...msg, isPinned: messageData.isPinned }
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

    // MODIFIED: Remove currentConversation check, validate receiver instead
    const handleFormSubmit = useCallback(async (formData) => {
        // Validate that we have content/attachment and a receiver
        if ((!formData.content.trim() && !formData.attachment) || !formData.receiver) {
            console.error('Cannot send message: missing content or receiver');
            return;
        }

        try {
            let submitData;
            let config = {};
            let previewAttachment = null;

            if (formData.attachment) {
                // Create a preview URL for immediate display
                if (formData.attachment.type.startsWith('image/')) {
                    previewAttachment = URL.createObjectURL(formData.attachment);
                }

                // use formData if there's an attachment
                submitData = new FormData();
                
                submitData.append('sender', formData.sender);
                submitData.append('receiver', formData.receiver);
                submitData.append('content', formData.content);
                submitData.append('attachment', formData.attachment);
                
                // Important: Do NOT set Content-Type header - let browser handle it
                // config.headers will be empty or not set
            } else {
                // Send as JSON if no file
                submitData = {
                    sender: formData.sender,
                    receiver: formData.receiver,
                    content: formData.content
                };
                config.headers = {
                    'Content-Type': 'application/json'
                };
            }
            
            // Create a temporary message with preview while waiting for server
            const tempMessage = {
                _id: `temp-${Date.now()}`,
                sender: {
                    _id: user._id, // ✅ Add _id
                    name: user.name, // ✅ Add name to match groupMessages expectation
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

            // Only show temporary message if we're in an existing conversation
            if (currentConversation) {
                setMessages(addMessageToGroups(tempMessage, user.name, user.profilePicture, user._id));
            }

            // Send to server
            const newMessage = await handleMessageApiCall(
                messageService.sendMessage,
                baseUrl,
                submitData,
                config
            );

            if (newMessage.attachment && newMessage.attachment.includes('public')) {
                newMessage.attachment = '/' + newMessage.attachment.split('public\\').pop().replace(/\\/g, '/');
            }

            // If we were in an existing conversation, replace temporary message
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

            // Emit to socket with actual message from server
            emitSocketEvent('send-message', newMessage, formData.receiver);
            
            // Update conversations list with actual message
            updateConversationsList(newMessage);

            // Clean up preview URL if it was created
            if (previewAttachment) {
                URL.revokeObjectURL(previewAttachment);
            }

            return newMessage; // Return the message for parent component to handle
        } catch (error) {
            console.error("Error sending message: ", error);
            
            // Remove temporary message on error (only if in existing conversation)
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
            
            throw error; // Re-throw for parent to handle
        }
    }, [currentConversation, baseUrl, user, emitSocketEvent, addMessageToGroups, updateConversationsList, handleMessageApiCall]);

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
            updateConversationsList(updatedMessage, { isEdit: true });
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
            updateConversationsList(deletedMessage, { isDelete: true });
            setSelectedMessage(null);
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    }, [baseUrl, emitSocketEvent, deleteMessageFromGroups, updateConversationsList, setSelectedMessage, handleMessageApiCall]);

    const handlePinMessage = useCallback(async (message) => {
        try {
            const messageToPin = await handleMessageApiCall(
                messageService.pinMessage,
                baseUrl,
                message._id
            )
            
            updateConversationsList(messageToPin, { isPinUpdate: true });
            setSelectedMessage(null);
        } catch (error) {
            console.error('Error pinning/unpinnning message', error)
        }
    }, [baseUrl, updateConversationsList, setSelectedMessage, handleMessageApiCall]);

    // SOCKET LISTENERS — real-time updates
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (newMessage) => {
            console.log('📨 Received new message:', newMessage);
            
            // Extract sender ID
            const senderId = newMessage.sender?._id || newMessage.sender;
            
            // Get sender name - handle both 'name' property and firstName/lastName
            const senderName = newMessage.sender?.name || 
                            (newMessage.sender?.firstName 
                                ? `${newMessage.sender.firstName} ${newMessage.sender.lastName}`
                                : currentConversation?.receiver?.name || 
                                    `${currentConversation?.receiver?.firstName} ${currentConversation?.receiver?.lastName}`);
            
            console.log('📨 senderId:', senderId, 'senderName:', senderName);
            
            // Check if this message belongs to the current conversation
            if (currentConversation?.receiver?._id !== senderId) {
                console.log('❌ Message not for current conversation');
                return;
            }

            console.log('✅ Adding message to groups');
            
            setMessages(addMessageToGroups(
                newMessage, 
                senderName,
                currentConversation.receiver.profilePicture,
                senderId
            ));
            updateConversationsList(newMessage);
        };

        const handleUpdateMessage = (updatedMessage) => {
            setMessages(updateMessageInGroups(updatedMessage._id, updatedMessage.content));
            updateConversationsList(updatedMessage, { isEdit: true });
        };

        const handleDeleteMessage = (deletedMessage) => {
            setMessages(deleteMessageFromGroups(deletedMessage._id));
            updateConversationsList(deletedMessage, { isDelete: true });
        };

        const handleMessagesSeen = (data) => {
            const { messageIds, seenBy, seenAt } = data;

            setMessages(updateMessageSeenStatus(messageIds, true, seenAt));
            updateConversationsList(messageIds, { isSeenUpdate: true, seenAt })
        }

        socket.on("new-message", handleNewMessage);
        socket.on("update-message", handleUpdateMessage);
        socket.on("pin-message", handlePinMessage);
        socket.on("delete-message", handleDeleteMessage);
        socket.on("messages-seen", handleMessagesSeen);

        return () => {
            socket.off("new-message", handleNewMessage);
            socket.off("update-message", handleUpdateMessage);
            socket.off("pin-message", handlePinMessage);
            socket.off("delete-message", handleDeleteMessage);
            socket.off("messages-seen", handleMessagesSeen);
        };
    }, [socket, currentConversation, user._id, updateConversationsList, addMessageToGroups, updateMessageInGroups, deleteMessageFromGroups, updateMessageSeenStatus]);

    return {
        messages,
        loadOlderMessages,
        setMessages,
        handleFormSubmit,
        handleEditMessage,
        handleDeleteMessage,
        handlePinMessage
    };
};

export default useMessageOperations;