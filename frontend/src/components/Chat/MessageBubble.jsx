import React, { memo, useMemo, useCallback, useRef, useEffect } from "react"
import MessageActions from "./MessageActions";
import { useReadReceipts } from "../../contexts/ReadReciptsContext";
import { useChatSelection, useChatState } from "../../contexts/chats/ChatContext.jsx"
import { useMessageOperationsContext } from "../../contexts/chats/MessageOperationsContext.jsx";

const MessageBubble = ({ message, user }) => {
    const { selectedMessage, setSelectedMessage, handleMessageButtonAction } = useChatSelection();
    const { handlePinMessage } = useMessageOperationsContext();

    const bubbleRef = useRef();
    const { registerMessage } = useReadReceipts();

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

    const handlePin = useCallback((e) => {
        e.stopPropagation();
        handlePinMessage(message);
    }, [handlePinMessage, message]);
    
    const attachmentUrl = useMemo(() => {
        if (!message.attachment) return null;

        // If attachment is an object with url property
        if (typeof message.attachment === 'object' && message.attachment.url) {
            return message.attachment.url
        }

        // If attachment is a string (legacy format or preview URL)
        if (typeof message.attachment === 'string') {
            return message.attachment
        }

        return null;
    }, [message.attachment])

    // Memoize attachment name for alt text
    const attachmentName = useMemo(() => {
        if (!message.attachment) return null;

        if (typeof message.attachment === 'object') {
            return message.attachment.fileName || 'attachment';
        }

        if (typeof message.attachment === 'string') {
            return message.attachment.split('/').pop();
        }

        return 'attachment'
    }, [message.attachment])

    // Register message
    useEffect(() => {
        if (bubbleRef.current && !isOwnMessage && message.sender

        ) {
            registerMessage(bubbleRef.current, message._id, message)
        }
    }, [message._id, message, registerMessage])

    return (
        <div className="message-bubble" onClick={handleMessageClick} ref={bubbleRef}>
            {message.attachment && (
                <div className="attachment-and-content">
                    <img 
                        src={attachmentUrl}
                        alt={attachmentName}
                        onError={(e) => {
                            console.error('Failed to load: ', attachmentUrl)
                            e.target.style.display = 'none';
                        }}
                        loading="lazy"
                    />
                    {message.content && <span>{message.content}</span>}
                </div>
            )}
            {!message.attachment && <span>{message.content}</span>}
            
            <MessageActions
                isVisible={isSelected}
                isOwnMessage={isOwnMessage}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPin={handlePin}
            />
        </div>
    )
};


export default MessageBubble