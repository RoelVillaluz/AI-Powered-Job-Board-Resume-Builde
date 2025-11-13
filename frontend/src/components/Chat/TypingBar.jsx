import { useChatFormData, useChatSelection, useChatState } from "../../contexts/chats/ChatContext";
import { useEffect } from "react";
import { useFileInput } from "../../hooks/chats/useFileInput";

function TypingBar({ handleFormSubmit, handleEditMessage }) {
    const { editMode, setEditMode } = useChatState();
    const { formData, setFormData, handleChange } = useChatFormData();
    const { selectedMessage, setSelectedMessage } = useChatSelection();
    const { fileInputRef, 
            fileName, 
            setFileName,
            fileType, 
            setFileType,
            previewUrl, 
            setPreviewUrl,
            handleFileButtonClick, 
            handleFileChange, 
            handleClearAttachment } = useFileInput({ formData, setFormData, handleChange })

    const onSubmit = async (e) => {
        e.preventDefault();
        
        if (editMode) {
            // Pass the message and content to handleEditMessage
            handleEditMessage(selectedMessage, formData.content);
            // Clear form and reset edit mode
            setFormData(prev => ({ ...prev, content: '' }));
            setSelectedMessage(null);
        } else {
            try {
                await handleFormSubmit(formData);

                // Clear form content
                setFormData(prev => ({ 
                    ...prev, 
                    content: '',
                    attachment: null,
                }));

                setFileName('');
                setFileType('');
                setPreviewUrl(null);
                
            } catch (error) {
                console.error("Error in onSubmit:", error);
            }
        }
    };

    const handleCancelEdit = () => {
        setEditMode(false);
        setFormData(prev => ({ ...prev, content: '', attachment: null }));
        setSelectedMessage(null); 
    }

    return (
        <form className='typing-bar' style={{ alignItems: previewUrl ? 'end' : 'center' }} onSubmit={onSubmit}>

            <div className="column" style={{ width: '100%' }}>
                {previewUrl && (
                    <div className="attachment-preview">
                        <img src={previewUrl} alt={previewUrl} />
                        <div className="column">
                            <strong>{fileName.length > 30 ? fileName.slice(0, 30) + "..." : fileName}</strong>
                            <p>{fileType}</p>
                        </div>
                        <button id="clear-attachment-btn" onClick={handleClearAttachment} aria-label="Clear Attachment">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                )}
                <input type="text" 
                    placeholder='Write your message...'
                    value={formData.content}
                    onChange={(e) => handleChange("content", e.target.value)}
                />
            </div>

            <div className="actions">
                {!editMode ? (
                    <>
                        <button 
                            type="button" 
                            id="send-file-btn" 
                            aria-label="Send File"
                            onClick={handleFileButtonClick}
                        >
                            <i className="fa-solid fa-paperclip"></i>
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                id="file-input" 
                                style={{display: "none"}} 
                                multiple
                                aria-label="Add attachment"
                                onChange={handleFileChange}
                            />
                        </button>
                        <i className="fa-solid fa-microphone"></i>
                    </>
                ) : (
                    <button type="button" id="cancel-edit-btn" onClick={handleCancelEdit} aria-label="Cancel edit">
                        Cancel
                    </button>
                )}
                <button className="send-message-btn" disabled={!formData.content.trim()} aria-label="Send message">
                    <i className="fa-solid fa-paper-plane"></i>
                </button>
            </div>
        </form>
    )
}

export default TypingBar