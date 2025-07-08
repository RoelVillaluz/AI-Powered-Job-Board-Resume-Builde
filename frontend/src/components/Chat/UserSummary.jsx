import { memo } from "react";

const UserSummary = memo(({ currentConversation, loading }) => {

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
                <span className="status-circle active"></span>
                </figure>
                <h1>{currentConversation.receiver.name}</h1>
                <h3 className="status-text active">Online</h3>
            </section>
        )
    }

})

UserSummary.displayName = 'UserSummary';

export default UserSummary