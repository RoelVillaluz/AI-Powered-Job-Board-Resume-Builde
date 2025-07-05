import MessageBubble from "./MessageBubble"

function MessageGroup({ group, message, selectedMessage, setSelectedMessage, user, formatDate }) {
    return (
        <li className={group.sender === user.name ? 'receiver' : ''}>
            <img src={`/${group.profilePicture}`} alt={`${group.sender}'s profile picture`} />
            <div className="message-group">
                <time dateTime={group.rawDateTime}>{group.createdAt}</time>
                <div className="messages">
                    {group.messages.map((message) => (
                        <MessageBubble 
                            message={message}
                            selectedMessage={selectedMessage}
                            setSelectedMessage={setSelectedMessage}
                            user={user}
                            formatDate={formatDate}
                        />  
                    ))}
                </div>
            </div>
        </li>
    )
}

export default MessageGroup