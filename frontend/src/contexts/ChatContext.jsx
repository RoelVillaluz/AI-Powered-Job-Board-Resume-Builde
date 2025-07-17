import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "./AuthProvider";
import { useData } from "./DataProvider";
import axios from "axios"

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
    const { baseUrl } = useData();

    // chat related state (stable)
    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [action, setAction] = useState(null);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form-related state (frequently changing)
    const [formData, setFormData] = useState({
        sender: user._id,
        receiver: '',
        content: '',
    });

    useEffect(() => {
        const fetchUserConversations = async () => {
            if (!user?._id) return;

            setLoading(true);
            try {
                const response = await axios.get(`${baseUrl}/conversations/user/${user._id}`);
                const fetchedConversations = response.data.data || [];

                const sortedConversations = fetchedConversations.sort((a, b) =>
                    new Date(b.updatedAt) - new Date(a.updatedAt)
                );

                setConversations(sortedConversations);

                if (sortedConversations.length > 0) {
                    setCurrentConversation(sortedConversations[0]);
                }
            } catch (error) {
                console.error('Error fetching conversations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserConversations();
    }, [user?._id]);

    // Update receiver when current conversation changes 
    useEffect(() => {
        if (currentConversation?.receiver?._id) {
            setFormData(prev => ({
                ...prev,
                receiver: currentConversation.receiver._id
            }));
        } else {
            console.log('Chat Context Current Conversation: ', currentConversation)
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
        loading,
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