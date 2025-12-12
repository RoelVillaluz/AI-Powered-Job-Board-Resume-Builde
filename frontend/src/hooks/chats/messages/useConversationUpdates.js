import { useCallback } from "react";

export const useConversationUpdates = ({ currentConversation, setConversations }) => {
    const updateConversationsList = useCallback((messageData, options = {}) => {
        const { isEdit = false, isDelete = false, isSeenUpdate = false, isPinUpdate = false, seenAt = null } = options;
        
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

    return { updateConversationsList };
};