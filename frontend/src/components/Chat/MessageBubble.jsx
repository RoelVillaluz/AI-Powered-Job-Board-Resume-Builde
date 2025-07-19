import React, { memo, useMemo, useCallback, useRef, useEffect } from "react"
import { useChatSelection, useChatState } from "../../contexts/ChatContext"
import MessageActions from "./MessageActions";
import { useReadReceipts } from "../../contexts/ReadReciptsContext";

const MessageBubble = ({ message, user }) => {
    const { selectedMessage, setSelectedMessage, handleMessageButtonAction } = useChatSelection();

    const bubbleRef = useRef();
    const { registerMessage } = useReadReceipts();

    if (process.env.NODE_ENV === 'development') {
        const renderCount = React.useRef(0);
        renderCount.current++;
        console.log(`MessageBubble ${message._id} rendered ${renderCount.current} times`);
    }

    // Memoize computed values
    const isSelected = useMemo(() => {
        return selectedMessage?._id === message._id
    }, [selectedMessage?._id, message._id])

    const isOwnMessage = useMemo(() => {
        return message.sender._id === user._id
    }, [message.sender._id, user._id])

    const actionsClass = useMemo(() => {
        return isSelected ? 'actions visible' : 'actions'
    }, [isSelected])

    // Memoize click handler
    const handleMessageClick = useCallback(() => {
        if (isSelected) {
            setSelectedMessage(null)
        } else {
            setSelectedMessage(message)
        }
    }, [isSelected, setSelectedMessage, message])

    // Memoize button handlers
    const handleEdit = useCallback((e) => {
        handleMessageButtonAction(e, "edit", message)
    }, [handleMessageButtonAction, message])

    const handleDelete = useCallback((e) => {
        handleMessageButtonAction(e, "delete", message)
    }, [handleMessageButtonAction, message]);

    // Register message
    useEffect(() => {
        if (bubbleRef.current && !isOwnMessage && message.sender

        ) {
            registerMessage(bubbleRef.current, message._id, message)
        }
    }, [message._id, message, registerMessage])

    return (
        <div className="message-bubble" onClick={handleMessageClick} ref={bubbleRef}>
            <span>{message.content}</span>
            <MessageActions
                isVisible={isSelected}
                isOwnMessage={isOwnMessage}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </div>
    )
};


export default MessageBubble