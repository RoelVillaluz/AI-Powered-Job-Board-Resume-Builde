import React, { memo, useMemo, useCallback } from "react"
import { useChatContext } from "../../contexts/ChatContext"
import { formatDate } from "../utils/dateUtils";
const MessageBubble = (({ message ,selectedMessage, setSelectedMessage, user }) => {


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

    return (
        <React.Fragment key={message._id}>
            {formattedEditTime && (
                <time dateTime={message.updatedAt}>
                    Edited on {formattedEditTime}
                </time>
            )}
            <div className="message-bubble"
                onClick={() => {
                    if (selectedMessage?._id === message._id) {
                        setSelectedMessage(null)
                    } else {
                        setSelectedMessage(message)
                    }
                }}
            >
                <span>{message.content}</span>
                <div className={`${selectedMessage?._id === message._id ? 'actions visible': 'actions'}`}>
                    {message.sender._id === user._id ? (
                        <>
                        <button id="edit-message-btn" onClick={(e) => handleMessageButtonAction(e, "edit", message)}>
                            <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button className="negative" id="delete-message-btn" onClick={(e) => handleMessageButtonAction(e, "delete", message)}>
                            <i className="fa-solid fa-trash"></i>
                        </button>
                        </>
                    ) : (
                        <button className="negative" id="report-message-btn">
                            <i className="fa-solid fa-bullhorn"></i>
                        </button>
                    )}
                </div>
            </div>
        </React.Fragment>
    )

});


export default MessageBubble