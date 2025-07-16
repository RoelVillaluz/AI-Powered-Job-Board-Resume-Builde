import { useAuth } from "../../contexts/AuthProvider";
import MessageBubble from "./MessageBubble"
import { markMessagesAsSeen } from "../../services/messageServices";
import { memo, useMemo, useCallback, useRef } from "react";
import { useData } from "../../contexts/DataProvider";
import { formatDate } from "../utils/dateUtils";

const MessageGroup = memo(({ group }) => {
    const { user } = useAuth();
    const { baseUrl } = useData();

    // Destructure group properties early
    const { sender, profilePicture, rawDateTime, createdAt, messages } = group;

    // Memoize the class calculation
    const containerClass = useMemo(() => {
        return group.sender === user.name ? 'receiver' : ''
    }, [group.sender, user.name])

    // Memoize the message rendering
    const renderedMessages = useMemo(() => {
        return messages.map((message) => (
            <MessageBubble key={message._id} message={message} user={user}/>
        ));
    }, [messages, user])

    const isOwnMessages = useMemo(() => {
        if (!group.messages || group.messages.length === 0) return false;

        const senderId = group.messages[0].sender._id

        return senderId === user._id
    }, [group.messages, user])

    const isSeen = useMemo(() => {
        if (!group.messages || group.messages.length === 0) return false;

        return group.messages[0].seen
    }, [group.messages])

    return (
        <li className={containerClass}>
            <img src={`/${profilePicture}`} alt={`${sender}'s profile picture`} />
            <div className="message-group">
                <div className="wrapper" style={{ gap: '0rem' }}>
                    <time dateTime={rawDateTime}>{createdAt}</time>
                    {isOwnMessages && isSeen && (
                        <time>| Seen at {formatDate(group.messages[0].seenAt)}</time>
                    )}
                </div>
                <div className="messages">
                    {renderedMessages}
                </div>
            </div>
        </li>
    )
})

export default MessageGroup