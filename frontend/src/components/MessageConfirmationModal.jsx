function MessageConfirmationModal() {
    return (
        <>
            <div className="blurry-overlay">
                <div className="message-confirmation-modal">
                    <i className="fa-solid fa-triangle-exclamation" id="warning-icon" aria-label="warning"></i>
                    <h2>Are you sure?</h2>
                    <p>Are you sure you want to delete this comment?</p>
                    <div className="actions">
                        <button id="delete-btn" type="button">Delete</button>
                        <button id="cancel-btn" type="button">Cancel</button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default MessageConfirmationModal