import { act, memo, useCallback, useMemo } from "react"
import { formatDate } from "../../utils/dateUtils";
import { useSocket } from "../../../hooks/useSocket";

// Individual conversation item component
const ConversationItem = memo(({ convo, user, currentConversation, onConversationClick, loading }) => {
    const { onlineUsers } = useSocket();

    const handleClick = useCallback(() => {
        onConversationClick(convo);
    }, [convo, onConversationClick]);

    // Skeleton UI
    if (loading) {
        return (
            <li className="message-preview" style={{ pointerEvents: 'none' }}>
                <div className="skeleton circle"></div>
                <div className="message-details">
                    <div className="skeleton text long"></div>
                    <div className="skeleton text max-width"></div>
                </div>
            </li>
        );
    }

    // ✅ Strong validation
    if (!convo || !Array.isArray(convo.users) || convo.users.length < 2) {
        console.warn("Conversation missing users:", convo);
        return null;
    }

    if (!Array.isArray(convo.messages) || convo.messages.length === 0) {
        console.warn("Conversation has no messages:", convo);
        return null;
    }

    if (!user?._id) {
        console.warn("User undefined inside ConversationItem");
        return null;
    }

    // ✅ Safe receiver lookup
    const receiver = convo.users.find((u) => u._id !== user._id);
    if (!receiver) {
        console.warn("Receiver calculation failed for convo:", convo);
        return null;
    }

    // ✅ Safe last message
    const lastMessage = convo.messages.at(-1);
    if (!lastMessage || !lastMessage.sender) {
        console.warn("Invalid lastMessage structure:", lastMessage);
        return null;
    }

    const isSeen = !!lastMessage.seen;

    const isCurrentConvo = currentConversation?._id === convo._id;
    const convoClass = isCurrentConvo ? "current" : "";

    const isOnline = onlineUsers.has(receiver._id);

    return (
        <li className={`message-preview ${convoClass}`} onClick={handleClick}>
            <figure>
                <img
                    src={receiver.profilePicture}
                    alt={`${receiver.name}'s profile`}
                    onError={(e) => {
                        e.target.src = "/default-avatar.png";
                    }}
                />
                {isOnline && <span className="status-circle online"></span>}
            </figure>

            <div className="message-details">
                <div className="row">
                    <strong>{receiver.name}</strong>
                    <time dateTime={lastMessage.createdAt}>
                        {formatDate(lastMessage.updatedAt ?? lastMessage.createdAt, "short", true)}
                    </time>
                </div>

                <span className={`message-content ${isSeen ? "seen" : ""}`}>
                    {`${lastMessage.sender._id === user._id ? "You: " : ""}${lastMessage.content}`}
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