import { useEffect } from "react";

export const useMessageSocket = ({ 
    socket, 
    currentConversation, 
    user,
    setMessages,
    addMessageToGroups,
    updateMessageInGroups,
    deleteMessageFromGroups,
    updateMessageSeenStatus,
    updateConversationsList,
    handlePinMessage
}) => {
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (newMessage) => {
            console.log('📨 Received new message:', newMessage);
            
            const senderId = newMessage.sender?._id || newMessage.sender;
            const senderName = newMessage.sender?.name || 
                            (newMessage.sender?.firstName 
                                ? `${newMessage.sender.firstName} ${newMessage.sender.lastName}`
                                : currentConversation?.receiver?.name || 
                                    `${currentConversation?.receiver?.firstName} ${currentConversation?.receiver?.lastName}`);
            
            console.log('📨 senderId:', senderId, 'senderName:', senderName);
            
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
            updateConversationsList(messageIds, { isSeenUpdate: true, seenAt });
        };

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
    }, [
        socket, 
        currentConversation, 
        user._id, 
        setMessages,
        addMessageToGroups,
        updateMessageInGroups,
        deleteMessageFromGroups,
        updateMessageSeenStatus,
        updateConversationsList,
        handlePinMessage
    ]);
};