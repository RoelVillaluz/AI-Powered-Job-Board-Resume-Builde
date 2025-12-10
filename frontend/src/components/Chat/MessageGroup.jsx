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
    const { sender, profilePicture, rawDateTime, createdAt, messages } = group

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

        const senderId = group.messages[0].sender._id || group.messages[0].sender

        return senderId === user._id
    }, [group.messages, user])

    const lastMessage = useMemo(() => {
        if (!group.messages || group.messages.length === 0) return;

        return group.messages[group.messages.length - 1];
    }, [group.messages]);

    const isSeen = useMemo(() => {
        return lastMessage.seen || false
    }, [lastMessage])

    const seenAt = useMemo(() => {
        return formatDate(lastMessage?.seenAt)
    }, [lastMessage])

    return (
        <li className={containerClass}>
            <img 
                className="sender-profile-pic" 
                src={`/${profilePicture}`} 
                alt={`${sender}'s profile picture`} 
                loading="lazy"
            />
            <div className="message-group">
                <div className="wrapper" style={{ gap: '0rem' }}>
                    <time dateTime={rawDateTime}>{createdAt}</time>
                    {isOwnMessages && isSeen && (
                        <time> • Seen at {seenAt}</time>
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