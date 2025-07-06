import React from "react"
import { useChatContext } from "../../contexts/ChatContext"

function MessageBubble({ message, selectedMessage, setSelectedMessage, user, formatDate }) {

    const { handleMessageButtonAction } = useChatContext();

    return (
        <React.Fragment key={message._id}>
            {message.updatedAt !== null && (
                <time dateTime={message.updatedAt}>Edited on {formatDate(message.updatedAt)}</time>
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
}

export default MessageBubble