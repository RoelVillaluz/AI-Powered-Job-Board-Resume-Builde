import { useChatFormData, useChatSelection, useChatState } from "../../contexts/ChatContext";
import { useEffect } from "react";
function TypingBar({ handleFormSubmit, handleEditMessage }) {
    const { editMode, setEditMode } = useChatState();
    const { formData, setFormData, handleChange } = useChatFormData();
    const { selectedMessage, setSelectedMessage } = useChatSelection();

    const onSubmit = (e) => {
        e.preventDefault();
        
        if (editMode) {
            // Pass the message and content to handleEditMessage
            handleEditMessage(selectedMessage, formData.content);
            // Clear form and reset edit mode
            setFormData(prev => ({ ...prev, content: '' }));
            setSelectedMessage(null);
        } else {
            // Pass the formData to handleFormSubmit
            handleFormSubmit(formData);
            // Clear form content
            setFormData(prev => ({ ...prev, content: '' }));
        }
    };

    useEffect(() => {
        console.log('Form Data: ',formData)
    }, [formData])

    return (
        <form className='typing-bar' onSubmit={onSubmit}>
            <input type="text" 
                placeholder='Write your message...'
                value={formData.content}
                onChange={(e) => handleChange("content", e.target.value)}
            />
            <div className="actions">
                {!editMode ? (
                    <>
                        <button type="button" id="send-file-btn">
                            <i className="fa-solid fa-paperclip"></i>
                            <input type="file" id="file-input" style={{display: "none"}} multiple/>
                        </button>
                        <i className="fa-solid fa-microphone"></i>
                    </>
                ) : (
                    <button type="button" id="cancel-edit-btn" onClick={() => {
                        setEditMode(false);
                        setFormData(prev => ({ ...prev, content: '' }));
                        setSelectedMessage(null); 
                    }}>
                        Cancel
                    </button>
                )}
                <button className="send-message-btn" disabled={!formData.content.trim()}>
                    <i className="fa-solid fa-paper-plane"></i>
                </button>
            </div>
        </form>
    )
}

export default TypingBar