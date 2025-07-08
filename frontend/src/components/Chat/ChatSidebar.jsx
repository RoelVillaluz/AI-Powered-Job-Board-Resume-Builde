import { useCallback, useMemo, useRef, useEffect } from "react";
import { formatDate } from "../utils/dateUtils"
import { useConversationSearch } from "../../hooks/chats/useConversationSearch";
import ConversationList from "./ConversationList";

function ChatSidebar({ user, currentConversation, setCurrentConversation, conversations, setShowComposeMessage, setCurrentReceiver, handleChange, loading }) {
    const { searchConversationQuery, setSearchConversationQuery, filteredConvos } = useConversationSearch(conversations, user);

    const handleShowComposeHeader = useCallback(() => {
        setShowComposeMessage((prev) => !prev)
        setCurrentReceiver(null)
        handleChange("receiver", "")
    }, []); // Empty dependencies since these should be stable

    const handleConversationClick = useCallback((convo) => {
        setCurrentConversation(convo);
    }, []); // Empty dependency since setCurrentConversation should be stable

    return (
        <aside id="chat-sidebar">

            <header>
                <i className="fa-solid fa-angle-left"></i>
                <h1>My Chats</h1>
            </header>

            <section id="user-summary">
                <i className="fa-solid fa-gear"></i>
                {loading ? (
                        <>
                            <div className="skeleton circle"></div>
                            <div className="skeleton rectangle"></div>
                        </>
                    ) : currentConversation ? (
                            <>
                                <figure className="user-avatar">
                                <img
                                    src={currentConversation.receiver.profilePicture}
                                    alt={`${currentConversation.receiver.name}'s profile picture`}
                                />
                                <span className="status-circle active"></span>
                                </figure>
                                <h1>{currentConversation.receiver.name}</h1>
                                <h3 className="status-text active">Online</h3>
                            </>
                    ) : (
                    <h3>No conversation selected.</h3>
                )}
            </section>


            <section id="search-message">
                <div className="message-search-bar">
                    <input 
                        type="text" 
                        placeholder="Search"
                        value={searchConversationQuery}
                        onChange={(e) => setSearchConversationQuery(e.target.value)}
                    />
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

                <ConversationList
                    filteredConvos={filteredConvos}
                    user={user}
                    currentConversation={currentConversation}
                    onConversationClick={handleConversationClick}
                />
                
            </section>

        </aside>
    )
}

export default ChatSidebar;
