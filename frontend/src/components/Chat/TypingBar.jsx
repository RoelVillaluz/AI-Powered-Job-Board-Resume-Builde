import { useChatFormData, useChatState } from "../../contexts/ChatContext";
import { useEffect } from "react";
function TypingBar({ handleFormSubmit, handleEditMessage }) {
    const { selectedMessage, setSelectedMessage, editMode, setEditMode } = useChatState();
    const { formData, setFormData, handleChange } = useChatFormData();

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
                        <i className="fa-solid fa-paperclip"></i>
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