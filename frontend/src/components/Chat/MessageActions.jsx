import { memo } from "react";

const MessageActions = memo(({ isVisible, isOwnMessage, onEdit, onDelete, onPin }) => {
    const actionsClass = isVisible ? 'actions visible' : 'actions';

    return (
        <div className={actionsClass}>
            <button id="pin-message-btn" aria-label="Pin message" onClick={onPin}>
                <i className="fa-solid fa-thumbtack"></i>
            </button>
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