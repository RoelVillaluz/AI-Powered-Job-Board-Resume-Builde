import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "./AuthProvider";
import { useData } from "./DataProvider";
import axios from "axios"

const ChatStateContext = createContext();
const ChatFormContext = createContext();
const ChatSelectionContext = createContext();

export const useChatState = () => {
    const context = useContext(ChatStateContext);
    if (!context) {
        throw new Error('useChatState must be used within a ChatProvider');
    }
    return context;
};

export const useChatFormData = () => {
    const context = useContext(ChatFormContext);
    if (!context) {
        throw new Error('useChatFormData must be used within a ChatProvider');
    }
    return context;
};

export const useChatSelection = () => {
    const context = useContext(ChatSelectionContext);
    if (!context) {
        throw new Error('useChatSelection must be used within a ChatProvider');
    }
    return context;
};

// Backward compatibility hook
export const useChatContext = () => {
    const chatState = useChatState();
    const chatFormData = useChatFormData();
    const chatSelection = useChatSelection();
    
    return { ...chatState, ...chatFormData, ...chatSelection }
}

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();
    const { baseUrl } = useData();
    
    // chat related state (stable)
    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [action, setAction] = useState(null);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // Selection state (frequently changing)
    const [selectedMessage, setSelectedMessage] = useState(null);
    
    // Form-related state (frequently changing)
    const [formData, setFormData] = useState({
        sender: user?._id || '',
        receiver: '',
        content: '',
        attachment: null,
    });

    useEffect(() => {
        if (user?._id) {
            setFormData(prev => ({
                ...prev,
                sender: user._id
            }));
        }
    }, [user?._id]);

    useEffect(() => {
        const fetchUserConversations = async () => {
            if (!user?._id || !baseUrl) {
                setLoading(false);
                return;
            }
            
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
    }, [user?._id, baseUrl]);

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

    // Create action handlers that can be called from selection context
    const startEdit = useCallback((message) => {
        setEditMode(true);
        setFormData((prev) => ({
            ...prev,
            content: message.content,
        }));
    }, []);
    
    const startDelete = useCallback(() => {
        handleShowConfirmationModal();
    }, [handleShowConfirmationModal]);
    
    const setActionType = useCallback((actionType) => {
        setAction(actionType);
    }, []);

    const messageActions = useMemo(() => ({
        startEdit,
        startDelete,
        setActionType
    }), [startEdit, startDelete, setActionType]);

    // Memoize chat state context (stable state only)
    const chatStateValue = useMemo(() => ({
        conversations,
        setConversations,
        currentConversation,
        setCurrentConversation,
        editMode,
        setEditMode,
        action,
        setAction,
        showConfirmationModal,
        setShowConfirmationModal,
        handleShowConfirmationModal,
        loading,
        messageActions, // Provide actions to selection context
    }), [
        conversations,
        currentConversation,
        editMode,
        action,
        showConfirmationModal,
        handleShowConfirmationModal,
        loading,
        messageActions,
    ]);

    const chatFormValue = useMemo(() => ({
        formData,
        setFormData,
        handleChange,
    }), [formData, handleChange]);

    // Selection context with its own action handler
    const handleMessageButtonAction = useCallback(
        (e, actionType, message) => {
            e.stopPropagation();
            setActionType(actionType);
            setSelectedMessage(message);
            
            if (actionType === 'delete') {
                startDelete();
            } else if (actionType === 'edit') {
                startEdit(message);
            }
        },
        [setActionType, startDelete, startEdit]
    );

    const chatSelectionValue = useMemo(() => ({
        selectedMessage,
        setSelectedMessage,
        handleMessageButtonAction,
    }), [selectedMessage, handleMessageButtonAction]);

    return (
        <ChatStateContext.Provider value={chatStateValue}>
            <ChatFormContext.Provider value={chatFormValue}>
                <ChatSelectionContext.Provider value={chatSelectionValue}>
                    {children}
                </ChatSelectionContext.Provider>
            </ChatFormContext.Provider>
        </ChatStateContext.Provider>
    );
};