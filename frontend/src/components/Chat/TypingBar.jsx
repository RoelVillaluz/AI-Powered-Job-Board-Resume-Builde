import { useChatFormData, useChatSelection, useChatState } from "../../contexts/ChatContext";
import { useEffect } from "react";
function TypingBar({ handleFormSubmit, handleEditMessage }) {
    const { editMode, setEditMode } = useChatState();
    const { formData, setFormData, handleChange } = useChatFormData();
    const { selectedMessage, setSelectedMessage } = useChatSelection();

    const fileInputRef = useRef(null);
    const [fileName, setFileName] = useState();
    const [fileType, setFileType] = useState();
    const [previewUrl, setPreviewUrl] = useState(null);

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

    const handleFileButtonClick = () => {
        fileInputRef.current?.click();
    }

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
                        <button 
                            type="button" 
                            id="send-file-btn" 
                            onClick={handleFileButtonClick}
                        >
                            <i className="fa-solid fa-paperclip"></i>
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                id="file-input" 
                                style={{display: "none"}} 
                                multiple
                                onChange={handleFileChange}
                            />
                        </button>
                        <i className="fa-solid fa-microphone"></i>
                    </>
                ) : (
                    <button type="button" id="cancel-edit-btn" onClick={handleCancelEdit}>
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