import React from "react";
import { useEffect, useState } from "react"
import Layout from "../components/Layout"
import { useAuth } from "../components/AuthProvider"
import { useData } from "../DataProvider";
import axios from "axios";
import MessageConfirmationModal from "../components/MessageConfirmationModal";
import { useSocket } from "../hooks/useSocket"; 
import { formatDate } from "../components/utils/dateUtils.js";
import MessageGroup from "../components/Chat/MessageGroup";
import { useConversations } from "../hooks/useConversations.jsx"
import { useUserSearch } from "../hooks/useUserSearch.jsx"
import ChatSidebar from "../components/Chat/ChatSidebar.jsx";

function ChatsPage() {
    const { baseUrl } = useData();
    const { user } = useAuth();
    const socket = useSocket(); 

    // Use custom hooks
    const { conversations, setConversations, currentConversation, setCurrentConversation } = useConversations(baseUrl, user?._id)
    const { searchReceiverQuery, setSearchReceiverQuery, searchReceiverResults } = useUserSearch(baseUrl)

    const [currentReceiver, setCurrentReceiver] = useState(null);

    const [selectedMessage, setSelectedMessage] = useState(null);
    const [action, setAction] = useState(null);

    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
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
        setConversations,
        editMode,
        setEditMode,
        selectedMessage,
        setSelectedMessage
    })

    useEffect(() => {
        document.title = 'Messages'
    }, [])

    useEffect(() => {
        console.log('Form data: ', formData)
    }, [formData])

    useEffect(() => {
        if (currentConversation) {
            setFormData((prev) => ({
                ...prev,
                receiver: currentConversation.receiver._id
            }))
            setMessages(groupMessages(currentConversation.messages))
        }
    }, [currentConversation])
        
    useEffect(() => {
        console.log('Selected message: ', selectedMessage)
    }, [selectedMessage])

    const handleChange = (name, value) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFormSubmit = async (e) => {
        if (e) e.preventDefault();

        try {
            const response = await axios.post(`${baseUrl}/messages`, formData);
            const newMessage = response.data.data;

            console.log(`New message sent to ${currentConversation.receiver.name}: `, response.data.data);

            // Emit the message to the server for real-time delivery
            if (socket) {
                socket.emit('send-message', {
                    ...newMessage,
                    receiverId: formData.receiver
                })
            }

            // Optimistically add new message locally to message groups
            setMessages((prevGroups) => {
                const lastGroup = prevGroups[prevGroups.length - 1]

                if (
                        lastGroup && 
                        lastGroup.sender === user.name &&
                        shouldGroupByTime(lastGroup.rawDateTime, newMessage.createdAt)
                ) {
                    // Append to existing group
                    const updatedGroups = [...prevGroups]
                    updatedGroups[updatedGroups.length - 1] = {
                        ...lastGroup,
                        messages: [...lastGroup.messages, newMessage],
                        rawDateTime: newMessage.createdAt
                    };
                    return updatedGroups
                } else {
                    // Create new message group
                    return [
                        ...prevGroups,
                        {
                            sender: user.name,
                            profilePicture: user.profilePicture, // assuming this exists
                            createdAt: formatDate(newMessage.createdAt),
                            rawDateTime: newMessage.createdAt,
                            messages: [newMessage]
                        }
                    ]
                }

            })

            // UPDATE CONVERSATIONS LIST
            setConversations((prevConvos) => {
            const updatedConvos = prevConvos.map((convo) =>
                convo._id === currentConversation._id
                    ? {
                        ...convo,
                        messages: [...convo.messages, newMessage],
                        updatedAt: newMessage.createdAt // set to message time!
                        }
                    : convo
                );

                // Sort conversations by latest message (most recent first)
                return [...updatedConvos].sort((a, b) => {
                    const dateA = new Date(a.updatedAt || a.messages.at(-1)?.createdAt || 0);
                    const dateB = new Date(b.updatedAt || b.messages.at(-1)?.createdAt || 0);
                    return dateB - dateA;
                });
            });


            handleChange("content", "");
        } catch (error) {
            console.error('Error sending message: ', error)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleFormSubmit()
        }
    }

    const handleMessageButtonAction = (e, actionType, message) => {
        e.stopPropagation();
        setAction(actionType);
        setSelectedMessage(message);

        if (actionType === 'delete') {
            handleShowConfirmationModal();
        } else if (actionType === 'edit') {
            setEditMode(true);
            setFormData((prev) => ({
                ...prev,
                content: message.content
            }))
        }
    }

    const handleShowConfirmationModal = () => {
        setShowConfirmationModal((prev) => !prev)
    }

    const handleEditMessage = async (message) => {
        try {
            console.log('Message to edit: ', message)
            const response = await axios.patch(`${baseUrl}/messages/${message._id}`, {
                content: formData.content
            })

            const updatedMessage = response.data.data;

            // Emit the update to the server for real-time delivery
            if (socket) {
                socket.emit('update-message', {
                    ...updatedMessage,
                    receiverId: currentConversation.receiver._id
                })
            }

            setMessages((prevGroups) => 
                prevGroups.map((group) => ({
                    ...group,
                    messages: group.messages.map((m) => m._id === message._id ? { ...m, content: formData.content } : m)
                }))
            )

            // UPDATE CONVERSATIONS LIST 
            setConversations((prevConvos) => {
                const updatedConvos = prevConvos.map((convo) => 
                    convo._id === currentConversation._id
                    ? {
                        ...convo,
                        messages: messageUtils.updateMessageContent(convo.messages, message._id, formData.content),
                        updatedAt: updatedMessage.updatedAt
                    }
                    : convo
                );

                // Move most recently updated to top
                const sortedConvos = [...updatedConvos].sort(
                    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
                );

                return sortedConvos;
            })

            console.log("Edited message: ", response.data.data)

            setEditMode(false)
            setFormData((prev) => ({
                ...prev,
                content: ''
            }))
        } catch (error) {
            console.log('Error editing message: ', message)
        }
    }

    const handleDeleteMessage = async (message) => {
        try {
            console.log('Message to delete: ', message)
            const response = await axios.delete(`${baseUrl}/messages/${message._id}`)
            console.log('Deleted message: ', response.data.data)

            const deletedMessage = response.data.data;

            // Emit the deletion to the server for real-time delivery
            if (socket) {
                socket.emit('delete-message', {
                    ...deletedMessage,
                    receiverId: currentConversation.receiver._id
                })
            }

            // Remove from local state - properly handle message groups
            setMessages((prevGroups) => {
                return prevGroups.map(group => {
                    // Filter out the deleted message from this group
                    const filteredMessages = group.messages.filter((msg) => msg._id !== message._id)

                    // Return the group with filtered messages
                   return ({
                       ...group,
                       messages: filteredMessages
                   })
               })
            })
            .filter(group => group.messages.length > 0) // Remove empty groups

            // UPDATE CONVERSATIONS LIST 
            setConversations((prevConvos) => {
                const updatedConvos = prevConvos.map((convo) => 
                    convo._id === currentConversation._id
                    ? {
                        ...convo,
                        messages: convo.messages.filter((msg) => msg._id !== message._id),
                    } : convo
                )
                
                return updatedConvos
            })

            // Reset selectedMessage state
            setSelectedMessage(null)
        } catch (error) {
            console.log('Error deleting message: ', message)
        }
    }

    return (
        <Layout>
            {showConfirmationModal && (
                <MessageConfirmationModal 
                    message={selectedMessage} 
                    action={action} 
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
                    <form className='typing-bar' onSubmit={(e) => {
                        e.preventDefault();
                        editMode ?  handleEditMessage(selectedMessage) : handleFormSubmit();
                    }}>
                        <input type="text" 
                            placeholder='Write your message...'
                            value={formData.content}
                            onChange={(e) => handleChange("content", e.target.value)}
                        />
                        <div className="actions">
                            {!editMode ? (
                                <>
                                    <i className="fa-solid fa-paperclip"></i>
                                    <i className="fa-solid fa-microphone"></i>
                                    
                                </>
                            ) : (
                                <button type="button" id="cancel-edit-btn" onClick={() => {
                                    setEditMode((prev) => !prev)
                                    setFormData((prev) => ({
                                        ...prev,
                                        content: ''
                                    }))
                                    setSelectedMessage(null); 
                                }}>
                                    Cancel
                                </button>
                            )}
                            <button className="send-message-btn">
                                <i className="fa-solid fa-paper-plane"></i>
                            </button>
                        </div>
                    </form>
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