import { createContext, useContext, useState, useCallback, Children } from "react";

const ChatContext = createContext();
export const useChatContext = () => useContext(ChatContext)

export const ChatProvider = ({ children }) => {
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [action, setAction] = useState(null);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);

    const handleShowConfirmationModal = useCallback(() => {
        setShowConfirmationModal((prev) => !prev)
    }, [])

    const handleMessageButtonAction = useCallback((e, actionType, message) => {
        e.stopPropagation();
        setAction(actionType);
        setSelectedMessage(message);

        if (actionType === 'delete') {
            handleShowConfirmationModal();
        } else if (actionType === 'edit') {
            setEditMode(true);
            setFormData((prev) => ({
                ...prev,
                content: message.content
            }))
        }
    }, [handleShowConfirmationModal])

    return (
        <ChatContext.Provider value={{
            selectedMessage,
            setSelectedMessage,
            editMode,
            setEditMode,
            action,
            setAction,
            showConfirmationModal,
            setShowConfirmationModal,
            handleMessageButtonAction
        }}>
            {children}
        </ChatContext.Provider>
    );

}