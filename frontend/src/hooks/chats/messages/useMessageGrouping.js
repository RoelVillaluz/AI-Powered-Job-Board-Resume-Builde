import { useState, useEffect, useCallback } from "react";
import { groupMessages, shouldGroupByTime } from "../../../components/utils/messageUtils.js";
import { formatDate } from "../../../components/utils/dateUtils.js";
import axios from "axios";

export const useMessageGrouping = ({ baseUrl, currentConversation }) => {
    const [messages, setMessages] = useState([]);

    // Initialize messages from current conversation
    useEffect(() => {
        if (currentConversation?.receiver?._id) {
            const messagesInChronologicalOrder = [...currentConversation.messages].reverse();
            setMessages(groupMessages(messagesInChronologicalOrder));
        }
    }, [currentConversation]);

    // Load older messages
    const loadOlderMessages = useCallback(async () => {
        if (messages.length === 0) return;
        
        const firstGroup = messages[0];
        const oldestMessage = firstGroup.messages[0];

        try {
            const response = await axios.get(`${baseUrl}/messages`, {
                params: { before: oldestMessage._id, limit: 20 },
            });

            const olderMessages = response.data.data || [];
            if (olderMessages.length === 0) return;
            
            const chronologicalOlder = [...olderMessages].reverse();
            
            setMessages(prev => {
                if (prev.length === 0) return groupMessages(chronologicalOlder);
                
                const firstExistingGroup = prev[0];
                const lastNewMessage = chronologicalOlder[chronologicalOlder.length - 1];
                
                const canMerge = 
                    firstExistingGroup.sender === lastNewMessage.sender.name &&
                    shouldGroupByTime(lastNewMessage.createdAt, firstExistingGroup.rawDateTime);
                
                if (canMerge) {
                    const newGroups = groupMessages(chronologicalOlder.slice(0, -1));
                    const mergedGroup = {
                        ...firstExistingGroup,
                        messages: [lastNewMessage, ...firstExistingGroup.messages],
                        rawDateTime: lastNewMessage.createdAt
                    };
                    return [...newGroups, mergedGroup, ...prev.slice(1)];
                } else {
                    const newGroups = groupMessages(chronologicalOlder);
                    return [...newGroups, ...prev];
                }
            });
        } catch (error) {
            console.error('Failed to load older messages: ', error);
        }
    }, [messages, baseUrl]);

    // Helper: Add message to groups
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
                        senderId: senderId,
                        profilePicture: profilePicture,
                        createdAt: formatDate(newMessage.createdAt),
                        rawDateTime: newMessage.createdAt,
                        messages: [newMessage]
                    }
                ];
            }
        };
    }, []);

    // Helper: Update message in groups
    const updateMessageInGroups = useCallback((messageId, updatedContent) => {
        return (prevGroups) => prevGroups.map(group => ({
            ...group,
            messages: group.messages.map(m =>
                m._id === messageId ? { ...m, content: updatedContent } : m
            )
        }));
    }, []);

    // Helper: Update seen status
    const updateMessageSeenStatus = useCallback((messageIds, seenStatus = true, seenAt = null) => {
        return (prevGroups) => prevGroups.map(group => ({
            ...group,
            messages: group.messages.map(m => 
                messageIds.includes(m._id) ? { ...m, seen: seenStatus, seenAt: seenAt } : m
            )
        }));
    }, []);

    // Helper: Delete message from groups
    const deleteMessageFromGroups = useCallback((messageId) => {
        return (prevGroups) => prevGroups
            .map(group => ({
                ...group,
                messages: group.messages.filter(m => m._id !== messageId)
            }))
            .filter(group => group.messages.length > 0);
    }, []);

    return {
        messages,
        setMessages,
        loadOlderMessages,
        addMessageToGroups,
        updateMessageInGroups,
        updateMessageSeenStatus,
        deleteMessageFromGroups
    };
};