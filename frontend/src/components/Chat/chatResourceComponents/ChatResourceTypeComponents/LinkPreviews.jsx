function LinkPreviews({ messages }) {
    return (
        <ul className="link-preview-list">
            {messages.map((msg) => (
                <li className="link-preview-item" key={msg._id}>
                    <a href={msg.linkPreview.url}>
                        <img className="link-preview-image" src={msg.linkPreview.image} alt={`${msg.linkPreview.title}`}/>
                        <div className="details">
                            <strong>{msg.linkPreview.title}</strong>
                            <p>{msg.linkPreview.url}</p>
                        </div>
                    </a>
                </li>
            ))}
        </ul>
    )
}

export default LinkPreviews