import { useEffect, useState } from "react"
import Layout from "../components/Layout"
import { useAuth } from "../contexts/AuthProvider.jsx"
import { useData } from "../contexts/DataProvider.jsx";
import { useChatContext } from "../contexts/ChatContext.jsx";
import MessageConfirmationModal from "../components/MessageConfirmationModal";
import { useSocket } from "../hooks/useSocket.js"; 
import MessageGroup from "../components/Chat/MessageGroup";
import { useConversations } from "../hooks/chats/useConversations.jsx"
import { useMessageOperations } from "../hooks/chats/useMessageOperations.jsx";
import ChatSidebar from "../components/Chat/ChatSidebar.jsx";
import TypingBar from "../components/Chat/TypingBar.jsx";
import ChatResources from "../components/Chat/ChatResources.jsx";
import ChatWindowHeader from "../components/Chat/ChatWindowHeader.jsx";

function ChatsPage() {
    const { baseUrl } = useData();
    const { user } = useAuth();
    const socket = useSocket(); 
    const { showConfirmationModal, handleShowConfirmationModal, selectedMessage, setSelectedMessage } = useChatContext();

    const [currentReceiver, setCurrentReceiver] = useState(null);
    const [showComposeMessage, setShowComposeMessage] = useState(false);

    // Use custom hooks
    const { conversations, setConversations, currentConversation, setCurrentConversation, loading } = useConversations(baseUrl, user?._id)
    const {
        messages,
        handleChange,
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
    }, [])

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
                        handleDeleteMessage(messageToDelete); // Use the message passed from modal
                        handleShowConfirmationModal();
                    }}
                />
            )}
            <main className="main-content" id="chats-page">

                {/* Chat List */}
                <ChatSidebar 
                    user={user}
                    currentConversation={currentConversation }
                    setCurrentConversation={setCurrentConversation}
                    conversations={conversations}
                    setShowComposeMessage={setShowComposeMessage}
                    setCurrentReceiver={setCurrentReceiver}
                    handleChange={handleChange}
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

                    <div className="messages-container">
                        {!showComposeMessage && (
                            <ul>
                                {messages.length > 0 && (
                                    messages.map((group, groupIndex) => (
                                        <MessageGroup 
                                            group={group} 
                                            key={groupIndex}
                                        />
                                    ))
                                )}
                            </ul>
                        )}
                    </div>

                    <TypingBar 
                        handleFormSubmit={handleFormSubmit}
                        handleEditMessage={handleEditMessage}
                        handleChange={handleChange}
                    />
                </section>

                {/* Chat Resources */}
                <ChatResources/>

            </main>
        </Layout>
    )
}

export default ChatsPage