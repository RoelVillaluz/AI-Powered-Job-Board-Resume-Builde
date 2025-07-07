import React, { memo, useMemo, useCallback } from "react"
import { useChatContext } from "../../contexts/ChatContext"
import { formatDate } from "../utils/dateUtils";
import MessageActions from "./MessageActions";

const MessageBubble = (({ message ,selectedMessage, setSelectedMessage, user }) => {

    const { handleMessageButtonAction }= useChatContext();

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

    const formattedEditTime = useMemo(() => {
        return message.updatedAt ? formatDate(message.updatedAt) : null
    }, [message.updatedAt])

    // Memoize click handler
    const handleMessageClick = useCallback(() => {
        if (isSelected) {
            setSelectedMessage(null)
        } else {
            setSelectedMessage(message)
        }
    }, [isSelected, selectedMessage, message])

    // Memoize button handlers
    const handleEdit = useCallback((e) => {
        handleMessageButtonAction(e, "edit", message)
    }, [handleMessageButtonAction, message])

    const handleDelete = useCallback((e) => {
        handleMessageButtonAction(e, "delete", message)
    }, [handleMessageButtonAction, message]);

    return (
        <React.Fragment key={message._id}>
            {formattedEditTime && (
                <time dateTime={message.updatedAt}>
                    Edited on {formattedEditTime}
                </time>
            )}
            <div className="message-bubble" onClick={handleMessageClick}>
                <span>{message.content}</span>
                <MessageActions
                    isVisible={isSelected}
                    isOwnMessage={isOwnMessage}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>
        </React.Fragment>
    )

});


export default MessageBubble