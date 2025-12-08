function AttachmentGrid({ messages = [] }) {  //  Default to empty array

    const getAttachmentUrl = (attachment) => {
        if (!attachment) return null;

        if (typeof attachment === 'object') {
            return attachment.url || null;  //
        }

        if (typeof attachment === 'string') {
            return attachment;  
        }

        return null;
    }

    // ✅ Show empty state if no messages
    if (!messages || messages.length === 0) {
        return (
            <div className="empty-state">
                <p>No attachments shared yet</p>
            </div>
        );
    }

    return (
        <ul className="attachments-resource-grid">
            {messages.map((msg) => {
                const attachmentUrl = getAttachmentUrl(msg.attachment);
                
                // Skip if no valid URL
                if (!attachmentUrl) return null;

                return (
                    <li key={msg._id}>
                        <img 
                            src={attachmentUrl} 
                            alt="Attachment"
                            onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/150/6B7280/ffffff?text=No+Image';
                            }}
                        />
                    </li>
                );
            })}
        </ul>
    );
}   

export default AttachmentGrid;