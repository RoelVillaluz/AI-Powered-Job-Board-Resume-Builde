export const useSocketListeners = () => {
    useEffect(() => {
            if (!socket) return;
    
            console.log('Setting up socket listeners...')
    
            const { handleNewMessage, handleMessageUpdated, handleMessageDeleted } = createMessageHandlers(
                user,
                currentConversation, 
                conversations, 
                setConversations, 
                setMessages, 
                formatDate, 
                shouldGroupByTime
            );                
    
            // Add event listeners
            socket.on('new-message', handleNewMessage);
            socket.on('update-message', handleMessageUpdated);
            socket.on('delete-message', handleMessageDeleted);
    
            // Cleanup function
            return () => {
                socket.off('new-message', handleNewMessage);
                socket.off('update-message', handleMessageUpdated);
                socket.off('delete-message', handleMessageDeleted);
            }
        }, [socket, currentConversation, user._id]); // Re-run when socket or currentConversation changes
}