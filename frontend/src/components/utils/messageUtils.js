import { formatDate } from "./dateUtils";

export const messageUtils = {
    // Extract sender info from message (handles both string ID and object cases)
    getSenderInfo: (message, user, currentConversation) => {
        const senderId = typeof message.sender === 'string' ? message.sender : message.sender._id;

        if (typeof message.sender !== 'string') {
            return {
                id: message.sender._id,
                name: message.sender.name,
                profilePicture: message.sender.profilePicture
            };
        }

        // Handle string case
        const isCurrentUser = senderId === user._id
        return {
            id: senderId,
            name: isCurrentUser ? user.name : currentConversation.receiver.name,
            profilePicture: isCurrentUser ? user.profilePicture : currentConversation.receiver.profilePicture
        };
    },

    // Check if message is relevant to current conversation
    isRelevantMessage: (message, user, currentConversation) => {
        if (!currentConversation) return false;

        const senderId = typeof message.sender === 'string' ? message.sender : message.sender._id;
        const receiverId = typeof message.receiver === 'string' ? message.receiver : message.receiver._id;

        return (
            (senderId === currentConversation.receiver._id && receiverId === user._id) ||
            (senderId === user._id && receiverId === currentConversation.receiver._id)
        );
    },

    // Add message to groups
    addMessageToGroups: (prevGroups, newMessage, senderInfo, formatDate, shouldGroupByTime) => {
        const lastGroup = prevGroups[prevGroups.length - 1];

        if (
            lastGroup && 
            lastGroup.sender === senderInfo.name &&
            shouldGroupByTime(lastGroup.rawDateTime, newMessage.createdAt)
        ) {
            // Append to existing group
            const updatedGroups = [...prevGroups];
            updatedGroups[updatedGroups.length - 1] = {
                ...lastGroup,
                messages: [...lastGroup.messages, newMessage],
                rawDateTime: newMessage.createdAt
            };
            return updatedGroups;
        } else {
            // Create new message group
            return [
                ...prevGroups,
                {
                    sender: senderInfo.name,
                    profilePicture: senderInfo.profilePicture,
                    createdAt: formatDate(newMessage.createdAt),
                    rawDateTime: newMessage.createdAt,
                    messages: [newMessage]
                }
            ];
        }
    },

    updateMessageContent: (messages, messageId, newContent) => {
        return messages.map((m) => 
            m._id === messageId ? { ...m, content: newContent } : m
        )
    },

    // Find conversation ID
    findConversationId: (message, conversations) => {
        const senderId = message.sender._id;
        const receiverId = message.receiver._id;

        const foundConvo = conversations.find((convo) => {
            // Check if this conversation involves both the sender and receiver
            if (convo.users && Array.isArray(convo.users)) {
                const userIds = convo.users.map(u => typeof u === 'object' ? u._id : u)
                return userIds.includes(senderId) && userIds.includes(receiverId);
            } 

            return false;
        })

        return foundConvo?._id
    }
};

// Create message event handlers
export const createMessageHandlers = (user, currentConversation, conversations, setConversations, setMessages, formatDate, shouldGroupByTime) => {

    const handleNewMessage = (newMessage) => {
        console.log('Received new message:', newMessage);

        if (!messageUtils.isRelevantMessage(newMessage, user, currentConversation)) {
            console.log('Message not relevant to current conversation');
            return;
        }

        console.log('Message is relevant, updating UI...');

        const senderInfo = messageUtils.getSenderInfo(newMessage, user, currentConversation);

        setMessages((prevGroups) => 
            messageUtils.addMessageToGroups(prevGroups, newMessage, senderInfo, formatDate, shouldGroupByTime)
        );

        // Update last message in conversations list and move to top
        setConversations((prevConvos) => {
            const updatedConvos = prevConvos.map((convo) =>
                convo._id === currentConversation._id
                ? {
                    ...convo,
                    messages: [...convo.messages, newMessage],
                    updatedAt: newMessage.createdAt // set to message time!
                    }
                : convo
            );

            // Sort conversations by latest message (most recent first)
            return [...updatedConvos].sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.messages.at(-1)?.createdAt || 0);
                const dateB = new Date(b.updatedAt || b.messages.at(-1)?.createdAt || 0);
                return dateB - dateA;
            });
        });
    };

    const handleMessageUpdated = (updatedMessage) => {
        console.log('Message updated:', updatedMessage);

        setMessages((prevGroups) => 
            prevGroups.map((group) => ({
                ...group,
                messages: group.messages.map((m) => m._id === updatedMessage._id ? updatedMessage : m)
            })
        ));

        // Update last message in conversations list and move to top
        setConversations((prevConvos) => {
            const updatedConvos = prevConvos.map((convo) => 
                convo._id === currentConversation._id
                ? {
                    ...convo,
                    messages: messageUtils.updateMessageContent(convo.messages, message._id, formData.content),
                    updatedAt: updatedMessage.updatedAt
                }
                : convo
            );

            return updatedConvos;
        })
    };

    const handleMessageDeleted = (deletedMessage) => {
        console.log('Message deleted:', deletedMessage);
        
        setMessages((prevGroups) => {
            return prevGroups.map(group => ({
                ...group,
                messages: group.messages.filter((msg) => msg._id !== deletedMessage._id)
            })).filter(group => group.messages.length > 0);
        });

        setConversations((prevConvos) => {
            const updatedConvos = prevConvos.map((convo) => 
                convo._id === currentConversation._id
                ? {
                    ...convo,
                    messages: convo.messages.filter((msg) => msg._id !== deletedMessage._id),
                } : convo
            )
            
            return updatedConvos
        })
    };

    return { handleNewMessage, handleMessageUpdated, handleMessageDeleted }
}

export const groupMessages = (messages) => {
    const grouped = [];
    let currentGroup = null;
    
    messages.forEach((message, index) => {
        const prevMessage = messages[index - 1];
        
        // Check if this message should be grouped with the previous one
        const shouldGroup = prevMessage && 
                        prevMessage.sender.name === message.sender.name &&
                        shouldGroupByTime(prevMessage.createdAt, message.createdAt);
        
        if (shouldGroup) {
            // Add to existing group
            currentGroup.messages.push(message);
        } else {

            const formattedDate = formatDate(message.createdAt);

            // Start new group
            currentGroup = {
                sender: message.sender.name,
                profilePicture: message.sender.profilePicture,
                createdAt: formattedDate,
                rawDateTime: message.createdAt,
                messages: [message]
            };
            grouped.push(currentGroup);
        }
    });
    
    return grouped;
};

export const shouldGroupByTime = (time1, time2) => {
    const date1 = new Date(time1);
    const date2 = new Date(time2);

    const diffInMinutes = Math.abs((date2 - date1) / (1000 * 60)); // convert ms to minutes

    // Group messages within 1 minute of each other
    return diffInMinutes <= 1;
}