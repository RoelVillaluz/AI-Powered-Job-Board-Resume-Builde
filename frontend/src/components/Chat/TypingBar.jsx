import { useChatContext } from "../../contexts/ChatContext";

function TypingBar({ handleFormSubmit, handleEditMessage, handleChange }) {
    const { formData, setFormData, selectedMessage, setSelectedMessage, editMode, setEditMode } = useChatContext();

    return (
        <form className='typing-bar' onSubmit={(e) => {
            e.preventDefault();
            editMode ?  handleEditMessage(selectedMessage) : handleFormSubmit();
        }}>
            <input type="text" 
                placeholder='Write your message...'
                value={formData.content}
                onChange={(e) => handleChange("content", e.target.value)}
            />
            <div className="actions">
                {!editMode ? (
                    <>
                        <i className="fa-solid fa-paperclip"></i>
                        <i className="fa-solid fa-microphone"></i>
                        
                    </>
                ) : (
                    <button type="button" id="cancel-edit-btn" onClick={() => {
                        setEditMode((prev) => !prev)
                        setFormData((prev) => ({
                            ...prev,
                            content: ''
                        }))
                        setSelectedMessage(null); 
                    }}>
                        Cancel
                    </button>
                )}
                <button className="send-message-btn">
                    <i className="fa-solid fa-paper-plane"></i>
                </button>
            </div>
        </form>
    )
}

export default TypingBar