import { memo, useCallback } from "react"
import { formatDate } from "../utils/dateUtils";

// Individual conversation item component
const ConversationItem = memo(({ convo, user, currentConversation, onConversationClick, loading }) => {
    const handleClick = useCallback(() => {
        onConversationClick(convo)
    }, [convo, onConversationClick])

    if (loading) {
        return (
            <li className="message-preview" style={{ pointerEvents: 'none' }}>
                <div className="skeleton circle"></div>
                <div className="message-details">
                    <div className="skeleton text long"></div>
                    <div className="skeleton text max-width"></div>
                </div>
            </li>
        )
    }

    // Early return if required data is missing
    if (!convo?.users || !convo?.messages || !user) {
        return null;
    }

    const receiver = useMemo(() => {
        return convo.users.find((u) => u._id !== user._id);
    }, [convo.users, user._id])

    const lastMessage = convo.messages.at(-1);
    
    // Additional safety checks
    if (!receiver || !lastMessage) {
        return null;
    }

    const isCurrentConvo = currentConversation?._id === convo._id;
    const convoClass = isCurrentConvo ? 'current' : '';

    return (
        <li className={`message-preview ${convoClass}`} onClick={handleClick}>
            <img 
                src={receiver.profilePicture} 
                alt={`${receiver.name}'s profile`} 
                onError={(e) => {
                    e.target.src = '/default-avatar.png'; // Fallback image
                }}
            />
            <div className="message-details">
                <div className="row">
                    <strong>{receiver.name}</strong>
                    <time dateTime={lastMessage.createdAt}>
                        {formatDate(lastMessage.updatedAt ?? lastMessage.createdAt, "short", true)}
                    </time>
                </div>
                <span className="message-content">
                    {`${lastMessage.sender._id === user._id ? 'You: ' : ''}${lastMessage.content}`}
                </span>
            </div>
        </li>
    );
});

ConversationItem.displayName = 'ConversationItem';

// Main conversation list component
const ConversationList = memo(({ filteredConvos, user, currentConversation, onConversationClick, loading }) => {

    if (loading) {
        return (
            <ul>
                {Array.from({ length: 4 }).map((_, index) => (
                <ConversationItem key={index} loading={true} />
                ))}
            </ul>
        );
    }

    if (!filteredConvos) {
        return (
            <p>No conversations found</p>
        )
    }
    
    return (
        <ul>
            {filteredConvos.map((convo) => (
                <ConversationItem
                    key={convo._id}
                    convo={convo}
                    user={user}
                    currentConversation={currentConversation}
                    onConversationClick={onConversationClick}
                    loading={false} // Explicitly pass false when not loading
                />
            ))}
        </ul>
    );
})

ConversationList.displayName = 'ConversationList';

export default ConversationList