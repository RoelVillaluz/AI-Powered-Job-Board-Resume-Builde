function PinnedMessages({ messages }) {
    if (!messages || messages.length === 0) {
        return (
            <div className="empty-state">
                <p>No pinned messages yet</p>
            </div>
        )
    }
}

export default PinnedMessages