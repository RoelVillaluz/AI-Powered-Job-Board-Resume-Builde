import { useCallback, useMemo, useRef, useEffect } from "react";
import { formatDate } from "../utils/dateUtils"
import { useConversationSearch } from "../../hooks/chats/useConversationSearch";
import ConversationList from "./ConversationList";
import UserSummary from "./UserSummary";
import { useChatFormData } from "../../contexts/ChatContext";

function ChatSidebar({ user, currentConversation, setCurrentConversation, conversations, setShowComposeMessage, setCurrentReceiver, loading }) {
    const { searchConversationQuery, setSearchConversationQuery, filteredConvos } = useConversationSearch(conversations, user);
    const { handleChange } = useChatFormData();

    const handleShowComposeHeader = useCallback(() => {
        setShowComposeMessage((prev) => !prev)
        setCurrentReceiver(null)
        handleChange("receiver", "")
    }, [setShowComposeMessage, setCurrentReceiver, handleChange]);

    const handleConversationClick = useCallback((convo) => {
        setCurrentConversation(convo);
    }, [setCurrentConversation]);

    return (
        <aside id="chat-sidebar">

            <header>
                <i className="fa-solid fa-angle-left"></i>
                <h1>My Chats</h1>
            </header>

            <UserSummary 
                currentConversation={currentConversation}
                loading={loading}
            />

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
                    loading={loading}
                />
                
                
            </section>

        </aside>
    )
}

export default ChatSidebar;
