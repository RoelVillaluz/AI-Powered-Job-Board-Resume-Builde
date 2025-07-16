import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "./AuthProvider";

const ChatStateContext = createContext();
const ChatFormContext = createContext();

export const useChatState = () => useContext(ChatStateContext);
export const useChatFormData = () => useContext(ChatFormContext);

// Backward compatibility hook
export const useChatContext = () => {
    const chatState = useChatState();
    const chatFormData = useChatFormData();

    return { ...chatState, ...chatFormData }
}

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();

    // chat related state (stable)
    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [action, setAction] = useState(null);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);

    // Form-related state (frequently changing)
    const [formData, setFormData] = useState({
        sender: user._id,
        receiver: '',
        content: '',
    });

    // Update receiver when current conversation changes
    useEffect(() => {
        if (currentConversation?.receiver?._id) {
            setFormData(prev => ({
                ...prev,
                receiver: currentConversation.receiver._id
            }));
        } else {
            console.log('Current Conversation: ', currentConversation)
        }
    }, [currentConversation]);

    const handleChange = useCallback((name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const handleShowConfirmationModal = useCallback(() => {
        setShowConfirmationModal((prev) => !prev);
    }, []);

    const handleMessageButtonAction = useCallback(
        (e, actionType, message) => {
            e.stopPropagation();
            setAction(actionType);
            setSelectedMessage(message);

            if (actionType === 'delete') {
                handleShowConfirmationModal();
            } else if (actionType === 'edit') {
                setEditMode(true);
                setFormData((prev) => ({
                ...prev,
                content: message.content,
                }));
            }
        },
        [handleShowConfirmationModal]
    );

    // Memoize chat state context (rarely changes)
    const chatStateValue = useMemo(() => ({
        conversations,
        setConversations,
        currentConversation,
        setCurrentConversation,
        selectedMessage,
        setSelectedMessage,
        editMode,
        setEditMode,
        action,
        setAction,
        showConfirmationModal,
        setShowConfirmationModal,
        handleMessageButtonAction,
        handleShowConfirmationModal,
    }), [
        conversations,
        currentConversation,
        selectedMessage,
        editMode,
        action,
        showConfirmationModal,
        handleMessageButtonAction,
        handleShowConfirmationModal,
    ]);

    const chatFormValue = useMemo(() => ({
        formData,
        setFormData,
        handleChange,
    }), [formData, handleChange]);

    return (
        <ChatStateContext.Provider value={chatStateValue}>
            <ChatFormContext.Provider value={chatFormValue}>
                {children}
            </ChatFormContext.Provider>
        </ChatStateContext.Provider>
    );
};