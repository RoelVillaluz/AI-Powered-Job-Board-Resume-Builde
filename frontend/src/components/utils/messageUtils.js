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
    }
};

// Create message event handlers
export const createMessageHandlers = (user, currentConversation, setMessages, formatDate, shouldGroupByTime) => {
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
    };

    const handleMessageUpdated = (updatedMessage) => {
        console.log('Message updated:', updatedMessage);

        setMessages((prevGroups) => 
            prevGroups.map((group) => ({
                ...group,
                messages: group.messages.map((m) => m._id === updatedMessage._id ? updatedMessage : m)
            })
        ));
    };

    return { handleNewMessage, handleMessageUpdated }
}