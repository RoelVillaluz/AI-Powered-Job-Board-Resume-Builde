import { useMemo } from "react";

function AttachmentGrid({ messages }) {

    const getAttachmentUrl = (attachment) => {
        if (!attachment) return null;

        if (typeof attachment === 'object') {
            return attachment.url || 'atachment';
        }

        if (typeof attachment === 'string') {
            return attachment.split('/').pop();
        }

    }

    return (
        <ul className="attachments-resource-grid">
            {messages.map((msg) => (
                <li key={msg._id}>
                    <img src={getAttachmentUrl(msg.attachment)}></img>
                </li>
            ))}
        </ul>
    )
}   

export default AttachmentGrid