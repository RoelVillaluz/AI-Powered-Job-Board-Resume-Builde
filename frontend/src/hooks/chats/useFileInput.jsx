import { useEffect, useRef, useState } from "react";

export const useFileInput = ({ formData, setFormData, handleChange }) => {
    const fileInputRef = useRef(null);
    const [fileName, setFileName] = useState();
    const [fileType, setFileType] = useState();
    const [previewUrl, setPreviewUrl] = useState(null);

    const handleFileButtonClick = () => {
        fileInputRef.current?.click();
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0] // assuming single file upload
        if (!file) return;

        setFormData((prev) => ({
            ...prev,
            attachment: file
        }))
        setFileName(file.name)
        setFileType(file.type)

        if (file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onload = (event) => {
                setPreviewUrl(event.target.result)
            };
            reader.readAsDataURL(file)
        } else {
            setPreviewUrl(null)
        }
    }

    const handleClearAttachment = () => {
        setFormData((prev) => ({
            ...prev,
            attachment: ''
        }))
        setFileName('')
        setPreviewUrl(null)
        setFileType('')
        
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
        }
    }

    return { 
        fileInputRef, 
        fileName, 
        fileType, 
        previewUrl, 
        handleFileButtonClick, 
        handleFileChange, 
        handleClearAttachment 
    };
}