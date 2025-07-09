import { memo, useMemo } from "react";
import { useSocket } from "../../hooks/useSocket";

const UserSummary = memo(({ currentConversation, loading }) => {
    const { onlineUsers } = useSocket();

    const isOnline = useMemo(() => {
        return onlineUsers.has(currentConversation.receiver._id)
    }, [onlineUsers, currentConversation])

    const statusClass = useMemo(() => {
        return isOnline ? 'online' : ''
    }, [isOnline])

    if (loading) {
        return (
            <section id="user-summary">
                <i className="fa-solid fa-gear"></i>
                <div className="skeleton circle"></div>
                <div className="skeleton rectangle"></div>
            </section>
        )
    }

    if (currentConversation) {
        return (
            <section id="user-summary">
                <figure className="user-avatar">
                    <img
                        src={currentConversation.receiver.profilePicture}
                        alt={`${currentConversation.receiver.name}'s profile picture`}
                    />
                    <span className={`status-circle ${statusClass}`}></span>
                </figure>
                <h1>{currentConversation.receiver.name}</h1>
                <h3 className={`status-text ${statusClass}`}>{isOnline ? 'Online' : 'Offline'}</h3>
            </section>
        )
    }

})

UserSummary.displayName = 'UserSummary';

export default UserSummary