import { createContext, useContext, useState, useCallback, Children } from "react";
import { useAuth } from "./AuthProvider";

const ChatContext = createContext();
export const useChatContext = () => useContext(ChatContext)

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();

    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [action, setAction] = useState(null);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [formData, setFormData] = useState({
        sender: user._id,
        receiver: '',
        content: '',
    });

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

    return (
        <ChatContext.Provider
            value={{
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
                formData,
                setFormData,
                handleMessageButtonAction,
                handleShowConfirmationModal,
                handleChange,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};
