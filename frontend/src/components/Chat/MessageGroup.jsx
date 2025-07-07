import MessageBubble from "./MessageBubble"
import { React, memo, useMemo, useCallback, useRef } from "react";

const MessageGroup = memo(({ group, user }) => {
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

    return (
        <li className={containerClass}>
            <img src={`/${profilePicture}`} alt={`${sender}'s profile picture`} />
            <div className="message-group">
                <time dateTime={rawDateTime}>{createdAt}</time>
                <div className="messages">
                    {renderedMessages}
                </div>
            </div>
        </li>
    )
})

export default MessageGroup