import { useCallback, useMemo, useRef, useEffect } from "react";
import { formatDate } from "../utils/dateUtils"
import { useConversationSearch } from "../../hooks/chats/useConversationSearch";
import ConversationList from "./chat_sidebar_components/ConversationList";
import UserSummary from "./UserSummary";
import { useChatFormData } from "../../contexts/chats/ChatContext";
import ChatSideSearchbar from "./chat_sidebar_components/ChatSideSearchbar";

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
        setShowComposeMessage(false)
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
            
            <ChatSideSearchbar
                value={searchConversationQuery}
                onChange={setSearchConversationQuery}
            />

            <section id="chat-list">

                <div className="row">
                    <h4>Last Messages</h4>
                    <div className="actions">
                        <button id="show-compose-message-btn" onClick={handleShowComposeHeader} aria-label="Show Compose Message Header">
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
