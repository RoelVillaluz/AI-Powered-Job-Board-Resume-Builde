import { useEffect, useState } from "react"
import Layout from "../components/Layout"
import { useAuth } from "../contexts/AuthProvider.jsx"
import { useData } from "../contexts/DataProvider.jsx";
import { useChatState, useChatSelection } from "../contexts/ChatContext.jsx";
import MessageConfirmationModal from "../components/MessageConfirmationModal";
import { useSocket } from "../hooks/useSocket.js"; 
import MessageGroup from "../components/Chat/MessageGroup";
import { useMessageOperations } from "../hooks/chats/useMessageOperations.jsx";
import ChatSidebar from "../components/Chat/ChatSidebar.jsx";
import TypingBar from "../components/Chat/TypingBar.jsx";
import ChatResources from "../components/Chat/ChatResources.jsx";
import ChatWindowHeader from "../components/Chat/ChatWindowHeader.jsx";
import MessagesContainer from "../components/Chat/MessagesContainer.jsx";

function ChatsPage() {
    
    // Call hooks in exact same order every time
    const { baseUrl } = useData();    
    const { user } = useAuth();
    const { socket } = useSocket();
    const chatSelectionResult = useChatSelection();
    
    // Extract values after all hooks are called
    const { 
        conversations, 
        setConversations, 
        currentConversation, 
        setCurrentConversation, 
        loading, 
        showConfirmationModal, 
        handleShowConfirmationModal, 
    } = useChatState() || {};
    
    const { selectedMessage } = chatSelectionResult || {};

    const [currentReceiver, setCurrentReceiver] = useState(null);
    
    const [showComposeMessage, setShowComposeMessage] = useState(false);

    const {
        messages,
        handleFormSubmit,
        handleEditMessage,
        handleDeleteMessage
    } = useMessageOperations({
        baseUrl,
        user,
        socket,
        currentConversation,
        setConversations
    });

    useEffect(() => {
        document.title = 'Messages'
    }, []);
    
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleFormSubmit()
        }
    }

    return (
        <Layout>
            {showConfirmationModal && (
                <MessageConfirmationModal 
                    message={selectedMessage} 
                    onClose={() => handleShowConfirmationModal()}
                    onSubmit={(messageToDelete) => {
                        handleDeleteMessage(messageToDelete);
                        handleShowConfirmationModal();
                    }}
                />
            )}
            <main className="main-content" id="chats-page">

                {/* Chat List */}
                <ChatSidebar 
                    user={user}
                    currentConversation={currentConversation}
                    setCurrentConversation={setCurrentConversation}
                    conversations={conversations}
                    setShowComposeMessage={setShowComposeMessage}
                    setCurrentReceiver={setCurrentReceiver}
                    loading={loading}
                />

                {/* Current Chat Window */}
                <section className="chat-window">

                    <ChatWindowHeader 
                        user={user}
                        currentConversation={currentConversation} 
                        showComposeMessage={showComposeMessage}
                        currentReceiver={currentReceiver}
                        setCurrentReceiver={setCurrentReceiver}
                    />

                    <MessagesContainer showComposeMessage={showComposeMessage} messages={messages}/>

                    <TypingBar 
                        handleFormSubmit={handleFormSubmit}
                        handleEditMessage={handleEditMessage}
                    />
                </section>

                {/* Chat Resources */}
                <ChatResources/>

            </main>
        </Layout>
    )
}

export default ChatsPage