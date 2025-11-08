import { useChatContext } from "../contexts/chats/ChatContext"

function MessageConfirmationModal({ message, onClose, onSubmit }) {
    const { action } = useChatContext();
    
    const formatAction = (action) => {
        return `${action[0].toUpperCase()}${action.slice(1)}`
    }

    return (
        <>
            <div className="blurry-overlay">
                <div className="message-confirmation-modal">
                    <i className="fa-solid fa-triangle-exclamation" id="warning-icon" aria-label="warning"></i>
                    <h2>{formatAction(action)} message?</h2>
                    <div className="actions">
                        <button id="delete-btn" type="button" onClick={() => onSubmit(message)}>Delete</button>
                        <button id="cancel-btn" type="button" onClick={onClose}>Cancel</button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default MessageConfirmationModal