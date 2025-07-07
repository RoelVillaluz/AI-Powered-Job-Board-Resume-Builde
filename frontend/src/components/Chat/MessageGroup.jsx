import { useAuth } from "../../contexts/AuthProvider";
import { useChatContext } from "../../contexts/ChatContext"
import MessageBubble from "./MessageBubble"
import { React, memo, useMemo, useCallback } from "react";

const MessageGroup = memo(({ group, message }) => {
    const { selectedMessage, setSelectedMessage } = useChatContext();
    const { user } = useAuth();

    // Memoize the class calculation
    const containerClass = useMemo(() => {
        return group.sender === user.name ? 'receiver' : ''
    }, [group.sender, user.name])

    // Memoize the message rendering
    const renderedMessages = useMemo(() => {
        return group.messages.map((message) => (
            <MessageBubble 
                key={message._id}
                message={message}
                selectedMessage={selectedMessage}
                setSelectedMessage={setSelectedMessage}
                user={user}
            />
        ));
    }, [group.messages, selectedMessage, setSelectedMessage, user]);


    return (
        <li className={containerClass}>
            <img src={`/${group.profilePicture}`} alt={`${group.sender}'s profile picture`} />
            <div className="message-group">
                <time dateTime={group.rawDateTime}>{group.createdAt}</time>
                <div className="messages">
                    {renderedMessages}
                </div>
            </div>
        </li>
    )
})

export default MessageGroup