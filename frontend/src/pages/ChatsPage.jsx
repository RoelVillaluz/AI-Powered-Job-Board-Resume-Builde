import React from "react";
import { useEffect, useState } from "react"
import Layout from "../components/Layout"
import { useAuth } from "../contexts/AuthProvider.jsx"
import { useData } from "../contexts/DataProvider.jsx";
import { useChatContext } from "../contexts/ChatContext.jsx";
import axios from "axios";
import MessageConfirmationModal from "../components/MessageConfirmationModal";
import { useSocket } from "../hooks/useSocket.js"; 
import { createMessageHandlers, messageUtils, groupMessages, shouldGroupByTime } from "../components/utils/messageUtils";
import { formatDate } from "../components/utils/dateUtils.js";
import MessageGroup from "../components/Chat/MessageGroup";
import { useConversations } from "../hooks/chats/useConversations.jsx"
import { useUserSearch } from "../hooks/chats/useUserSearch.jsx"
import { useMessageOperations } from "../hooks/chats/useMessageOperations.jsx";
import ChatSidebar from "../components/Chat/ChatSidebar.jsx";
import TypingBar from "../components/Chat/TypingBar.jsx";

function ChatsPage() {
    const { baseUrl } = useData();
    const { user } = useAuth();
    const socket = useSocket(); 
    const { showConfirmationModal, handleShowConfirmationModal, editMode, setEditMode, selectedMessage, setSelectedMessage } = useChatContext();

    const [currentReceiver, setCurrentReceiver] = useState(null);
    const [showComposeMessage, setShowComposeMessage] = useState(false);

    // Use custom hooks
    const { conversations, setConversations, currentConversation, setCurrentConversation } = useConversations(baseUrl, user?._id)
    const { searchReceiverQuery, setSearchReceiverQuery, searchReceiverResults } = useUserSearch(baseUrl)
    const {
        messages,
        setMessages,
        formData,
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

    useEffect(() => {
        console.log('Form data: ', formData)
    }, [formData])
        
    useEffect(() => {
        console.log('Selected message: ', selectedMessage)
    }, [selectedMessage])

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
                    formatDate={formatDate}
                />

                {/* Current Chat Window */}
                <section className="chat-window">
                    {(currentConversation && !showComposeMessage) ? (
                        <header>
                            <div className="user">
                                <img src={currentConversation.receiver.profilePicture} alt="" />
                                <address>
                                    <strong>{currentConversation.receiver.name}</strong>
                                    <span>{currentConversation.receiver.email}</span>
                                </address>
                            </div>
                            <div className="actions">
                                <i className="fa-solid fa-phone"></i>
                                <i className="fa-solid fa-video"></i>
                                <i className="fa-solid fa-ellipsis"></i>
                            </div>
                        </header>
                    ) : (
                        <header className="compose-message">
                            <h1>New Message</h1>
                            <div className="send-to">
                                <label>To:</label>
                                {formData.receiver === '' ? (
                                    <input type="text" placeholder="Search for a name" value={searchReceiverQuery} onChange={(e) => setSearchReceiverQuery(e.target.value)}/>
                                ) : (
                                    <div className="selected-receiver">
                                        <img src={currentReceiver.profilePicture} alt={`${currentReceiver.name}'s profile picture`} />
                                        <strong>{currentReceiver.name}</strong>
                                        <button className="remove-receiver-btn" onClick={() => {
                                            handleChange("receiver", "")
                                            setCurrentReceiver(null)
                                        }}>
                                            <i className="fa-solid fa-xmark"></i>
                                        </button>
                                    </div>
                                )}

                                {searchReceiverResults.length > 0 && ( 
                                    <ul className="results">
                                        {searchReceiverResults.filter(r => r._id !== user._id).map((result, index) => (
                                            <li key={index}>
                                                <button onClick={() => {
                                                        handleChange("receiver", result._id)
                                                        setCurrentReceiver(result)
                                                        setSearchReceiverQuery('')
                                                    }}>
                                                    <img src={result.profilePicture} alt={`${result.name}'s profile picture`} />
                                                    <strong>{result.name}</strong>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )} 

                            </div>
                        </header>
                    )}
                    <div className="messages-container">
                        {!showComposeMessage && (
                            <ul>
                                {messages.length > 0 && (
                                    messages.map((group, groupIndex) => (
                                        <MessageGroup 
                                            group={group} 
                                            key={groupIndex} 
                                            selectedMessage={selectedMessage}
                                            setSelectedMessage={setSelectedMessage}
                                            user={user} 
                                            formatDate={formatDate}
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
                <section className="chat-resources">
                    <header>
                        <h1>Chat Resources</h1>
                        <i className="fa-solid fa-angle-right"></i>
                    </header>
                    <ul>
                        <li className="resource-item">
                            <i className="fa-solid fa-folder"></i>
                            <div>
                                <strong>Files</strong>
                                <p>0 Items</p>
                            </div>
                            <i className="fa-solid fa-angle-right"></i>
                        </li>
                        <li className="resource-item">
                            <i className="fa-solid fa-link"></i>
                            <div>
                                <strong>Links</strong>
                                <p>0 Items</p>
                            </div>
                            <i className="fa-solid fa-angle-right"></i>
                        </li>
                        <li className="resource-item">
                            <i className="fa-solid fa-thumbtack"></i>
                            <div>
                                <strong>Pinned Messages</strong>
                                <p>0 Items</p>
                            </div>
                            <i className="fa-solid fa-angle-right"></i>
                        </li>
                        <li className="resource-item">
                            <i className="fa-solid fa-calendar-days"></i>
                            <div>
                                <strong>Scheduled Dates</strong>
                                <p>0 Items</p>
                            </div>
                            <i className="fa-solid fa-angle-right"></i>
                        </li>
                    </ul>
                </section>

            </main>
        </Layout>
    )
}

export default ChatsPage