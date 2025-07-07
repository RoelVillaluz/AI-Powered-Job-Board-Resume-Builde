import { memo } from "react";

const MessageActions = memo(({ isVisible, isOwnMessage, onEdit, onDelete }) => {
    const actionsClass = isVisible ? 'actions visible' : 'actions';

    return (
        <div className={actionsClass}>
            {isOwnMessage ? (
                <>
                    <button id="edit-message-btn" onClick={onEdit}>
                        <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button className="negative" id="delete-message-btn" onClick={onDelete}>
                        <i className="fa-solid fa-trash"></i>
                    </button>
                </>
            ) : (
                <button className="negative" id="report-message-btn">
                    <i className="fa-solid fa-bullhorn"></i>
                </button>
            )}
        </div>
    )
})

export default MessageActions