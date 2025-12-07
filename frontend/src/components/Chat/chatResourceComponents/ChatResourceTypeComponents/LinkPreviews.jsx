function LinkPreviews({ messages }) {
    
    const normalizeUrl = (url) => {
        try {
            const urlObj = new URL(url);
            // Combine hostname and pathname, remove trailing slash
            let display = urlObj.hostname + urlObj.pathname;
            if (display.endsWith('/')) display = display.slice(0, -1);
            return display;
        } catch (error) {
            console.warn('Invalid URL:', url);
            return url;
        }
    }

    return (
        <ul className="link-preview-list">
            {messages.map((msg) => (
                <li className="link-preview-item" key={msg._id}>
                    <a href={msg.linkPreview.url}>
                        <img className="link-preview-image" src={msg.linkPreview.image} alt={`${msg.linkPreview.title}`}/>
                        <div className="details">
                            <strong>{msg.linkPreview.title}</strong>
                            <p>{normalizeUrl(msg.linkPreview.url)}</p>
                        </div>
                    </a>
                </li>
            ))}
        </ul>
    )
}

export default LinkPreviews