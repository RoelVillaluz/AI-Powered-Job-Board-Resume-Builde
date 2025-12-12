import { useConversationUpdates } from "./useConversationUpdates";
import { useMessageGrouping } from "./useMessageGrouping";
import { useMessageHandlers } from "./useMessageHandlers";
import { useMessageSocket } from "./useMessageSocket";

export const useMessageOperations = ({ baseUrl, user, socket, currentConversation, setConversations }) => {
    // Message grouping & state
    const {
        messages,
        setMessages,
        loadOlderMessages,
        addMessageToGroups,
        updateMessageInGroups,
        updateMessageSeenStatus,
        deleteMessageFromGroups
    } = useMessageGrouping({ baseUrl, currentConversation });

    // Conversation list updates
    const { updateConversationsList } = useConversationUpdates({ 
        currentConversation, 
        setConversations 
    });

    // Message CRUD handlers
    const {
        handleFormSubmit,
        handleEditMessage,
        handleDeleteMessage,
        handlePinMessage
    } = useMessageHandlers({
        baseUrl,
        user,
        socket,
        currentConversation,
        setMessages,
        addMessageToGroups,
        updateMessageInGroups,
        deleteMessageFromGroups,
        updateConversationsList
    });

    // Socket listeners
    useMessageSocket({
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
    });

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