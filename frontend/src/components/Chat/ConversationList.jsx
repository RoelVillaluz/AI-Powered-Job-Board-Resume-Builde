import { memo, useCallback } from "react"
import { formatDate } from "../utils/dateUtils";

// Individual conversation item component
const ConversationItem = memo(({ convo, user, currentConversation, onConversationClick }) => {
    const receiver = convo.users.find((u) => u._id !== user._id);
    const lastMessage = convo.messages.at(-1);
    const isCurrentConvo = currentConversation?._id === convo._id;
    const convoClass = isCurrentConvo ? 'current' : '';

    const handleClick = useCallback(() => {
        onConversationClick(convo)
    }, [convo, onConversationClick])

    return (
        <li className={`message-preview ${convoClass}`} onClick={handleClick}>
            <img src={receiver.profilePicture} alt={receiver.profilePicture} />
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
})

ConversationItem.displayName = 'ConversationItem';

// Main conversation list component
const ConversationList = memo(({ filteredConvos, user, currentConversation, onConversationClick }) => {
    return (
        <ul>
            {filteredConvos.map((convo) => (
                <ConversationItem
                    key={convo._id}
                    convo={convo}
                    user={user}
                    currentConversation={currentConversation}
                    onConversationClick={onConversationClick}
                />
            ))}
        </ul>
    );
})

ConversationList.displayName = 'ConversationList';

export default ConversationList