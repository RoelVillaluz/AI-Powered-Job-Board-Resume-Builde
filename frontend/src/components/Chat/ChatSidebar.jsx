import { useCallback, useMemo } from "react";
import { formatDate } from "../utils/dateUtils"
    const handleShowComposeHeader = useCallback(() => {
        setShowComposeMessage((prev) => !prev)
        setCurrentReceiver(null)
        handleChange("receiver", "")
    }, [setShowComposeMessage, setCurrentReceiver, handleChange]);

    return (
        <aside id="chat-sidebar">

            <header>
                <i className="fa-solid fa-angle-left"></i>
                <h1>My Chats</h1>
            </header>

            {currentConversation && (
                <section id="user-summary">
                    <i className="fa-solid fa-gear"></i>
                    <figure className="user-avatar">
                        <img src={currentConversation.receiver.profilePicture} alt={`${currentConversation.receiver.name}'s profile picture`} />
                        <span className="status-circle active"></span>
                    </figure>
                    <h1>{currentConversation.receiver.name}</h1>
                    <h3 className="status-text active">Online</h3>
                </section>
            )}

            <section id="search-message">
                <div className="message-search-bar">
                    <input type="text" placeholder="Search"/>
                    <i className="fa-solid fa-magnifying-glass"></i>
                </div>
            </section>

            <section id="chat-list">

                <div className="row">
                    <h4>Last Messages</h4>
                    <div className="actions">
                        <button id="show-compose-message-btn" onClick={handleShowComposeHeader}>
                            <i className="fa-solid fa-plus"></i> 
                        </button>
                        <i className="fa-solid fa-ellipsis-vertical"></i>
                    </div>
                </div>

                <ul>
                    {conversations.map((convo) => {
                        const lastMessage = convo.messages.at(-1);

                        return (
                            <li className="message-preview" key={convo._id} onClick={() => setCurrentConversation(convo)}>
                                <img src={convo.receiver.profilePicture} alt={convo.receiver.profilePicture} />
                                <div className="message-details">
                                    <div className="row">
                                        <strong>{convo.receiver.name}</strong>
                                        <time dateTime={lastMessage.createdAt}>
                                            {formatDate(lastMessage.updatedAt ? lastMessage.updatedAt : lastMessage.createdAt, "short", true)}
                                        </time> 
                                    </div>
                                    <span className="message-content">
                                        {`${lastMessage.sender._id === user._id ? 'You: ': ''} ${lastMessage.content}`}
                                    </span>
                                </div>
                            </li>
                        )

                    })}
                </ul>
                
            </section>

        </aside>
    )
}

export default ChatSidebar