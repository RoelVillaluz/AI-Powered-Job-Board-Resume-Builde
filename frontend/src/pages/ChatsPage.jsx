import { useEffect, useState } from "react"
import Layout from "../components/Layout"
import { useAuth } from "../components/AuthProvider"
import { useData } from "../DataProvider";
import axios from "axios";
import MessageConfirmationModal from "../components/MessageConfirmationModal";

function ChatsPage() {
    const { baseUrl } = useData();
    const { user } = useAuth();

    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [currentReceiver, setCurrentReceiver] = useState(null);

    const [searchReceiverQuery, setSearchReceiverQuery] = useState('')
    const [searchReceiverResults, setSearchReceiverResults] = useState([]);

    const [selectedMessage, setSelectedMessage] = useState(null);
    const [action, setAction] = useState(null);

    const [showConfirmationModal, setShowConfirmationModal] = useState(false);

    const [messages, setMessages] = useState([]);
    const [formData, setFormData] = useState({
        sender: user._id,
        receiver: '',
        content: '',
    })

    useEffect(() => {
        document.title = 'Messages'
    }, [])

    useEffect(() => {
        const fetchUserConversations = async () => {
            try {
                const response = await axios.get(`${baseUrl}/conversations/user/${user._id}`)
                const fetchedConversations = response.data.data;

                // Sort conversations by latest message timestamp descending
                const sortedConversations = fetchedConversations.sort((a, b) => {
                    return new Date(b.updatedAt) - new Date(a.updatedAt);
                })

                setConversations(sortedConversations)

                if (sortedConversations.length > 0) {
                    setCurrentConversation(sortedConversations[0])
                }

                console.log('User conversations: ', fetchedConversations)
            } catch (error) {
                console.log('Error fetching conversations')
            }
        }
        if (user?._id) {
            fetchUserConversations();
        }
    }, [user])

    // Fetch users based on search input in compose message section
    useEffect(() => {
        if (!searchReceiverQuery.trim()) {
            setSearchReceiverResults([])
            return
        }

        const timeoutId = setTimeout(async() => {
            try {
                const response = await axios.get(`${baseUrl}/users/search`, {
                    params: { q: searchReceiverQuery, limit: 10 }
                });

                console.log(`Search results for query: ${searchReceiverQuery}`, searchReceiverResults)

                setSearchReceiverResults(response.data.data)
            } catch (error) {
                console.error("Search error", error);
            }
        }, 200) 

        
        return () => clearTimeout(timeoutId)
    }, [searchReceiverQuery])

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

    const formatDate = (time, mode = "long", getTimeDiff = false) => {
        const date = new Date(time);
        const currentYear = new Date().getFullYear();

        // Check if less than 24 hours ago
        const timeDiff = Math.abs(new Date() - date);
        const diffInHours = timeDiff / (1000 * 60 * 60);

        const options = {
            month: mode === "long" ? 'long' : 'short',
            day: 'numeric'
        };

        if (date.getFullYear() !== currentYear) {
            options.year = 'numeric';
        }

        if (mode === 'long') {
            options.hour = '2-digit';
            options.minute = '2-digit';
            options.hour12 = true;
        }

        if (getTimeDiff === true && diffInHours < 24) {
            return `${Math.floor(diffInHours)} hrs ago`;
        }

        return date.toLocaleDateString('en-US', options);
    };

    
    const groupMessages = (messages) => {
        const grouped = [];
        let currentGroup = null;
        
        messages.forEach((message, index) => {
            const prevMessage = messages[index - 1];
            
            // Check if this message should be grouped with the previous one
            const shouldGroup = prevMessage && 
                            prevMessage.sender.name === message.sender.name &&
                            shouldGroupByTime(prevMessage.createdAt, message.createdAt);
            
            if (shouldGroup) {
                // Add to existing group
                currentGroup.messages.push(message);
            } else {

                const formattedDate = formatDate(message.createdAt);

                // Start new group
                currentGroup = {
                    sender: message.sender.name,
                    profilePicture: message.sender.profilePicture,
                    createdAt: formattedDate,
                    rawDateTime: message.createdAt,
                    messages: [message]
                };
                grouped.push(currentGroup);
            }
        });
        
        return grouped;
    };

    const shouldGroupByTime = (time1, time2) => {
        const date1 = new Date(time1);
        const date2 = new Date(time2);

        const diffInMinutes = Math.abs((date2 - date1) / (1000 * 60)); // convert ms to minutes

        // Group messages within 1 minute of each other
        return diffInMinutes <= 1;
    }


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

            console.log(`New message sent to ${currentConversation.receiver.name}: `, response.data.data)    ;

            // Optimistically add new message locally to message groups
            setMessages((prevGroups) => {
                const lastGroup = prevGroups[prevGroups.length] - 1

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
        }
    }
    
    const handleShowConfirmationModal = () => {
        setShowConfirmationModal((prev) => !prev)
    }

    const handleDeleteMessage = async (message) => {
        try {
            console.log('Message to delete: ', message)
            const response = await axios.delete(`${baseUrl}/messages/${message._id}`)
            console.log('Deleted message: ', response.data.data)

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

            // Reset selectedMessage state
            setSelectedMessage(null)
        } catch (error) {
            
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
                                <i className="fa-solid fa-plus"></i>
                                <i className="fa-solid fa-ellipsis-vertical"></i>
                            </div>
                        </div>

                        <ul>
                            {conversations.map((convo) => {
                                const lastMessage = convo.messages.at(-1);

                                return (
                                    <li className="message-preview" key={convo._id}>
                                        <img src={convo.receiver.profilePicture} alt={convo.receiver.profilePicture} />
                                        <div className="message-details">
                                            <div className="row">
                                                <strong>{convo.receiver.name}</strong>
                                                <time datetime={lastMessage.createdAt}>{formatDate(lastMessage.createdAt, "short", true)}</time> 
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

                {/* Current Chat Window */}
                <section className="chat-window">
                    {currentConversation ? (
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
                        <ul>
                            {messages.length > 0 && (
                                messages.map((group, groupIndex) => (
                                    <li className={group.sender === user.name ? 'receiver' : ''} key={groupIndex}>
                                        <img src={`/${group.profilePicture}`} alt={`${group.sender}'s profile picture`} />
                                        <div className="message-group">
                                            <time datetime={group.rawDateTime}>{group.createdAt}</time>
                                            <div className="messages">
                                                {group.messages.map((message) => (
                                                    <div className="message-bubble" 
                                                        key={message._id} 
                                                        onClick={() => {
                                                            if (selectedMessage?._id === message._id) {
                                                                setSelectedMessage(null)
                                                            } else {
                                                                setSelectedMessage(message)
                                                            }
                                                        }}
                                                    >
                                                        <span>{message.content}</span>
                                                        <div className={`${selectedMessage?._id === message._id ? 'actions visible': 'actions'}`}>
                                                            {message.sender._id === user._id ? (
                                                                <>
                                                                <button id="edit-message-btn">
                                                                    <i className="fa-solid fa-pen-to-square"></i>
                                                                </button>
                                                                <button className="negative" id="delete-message-btn" onClick={(e) => handleMessageButtonAction(e, "delete", message)}>
                                                                    <i className="fa-solid fa-trash"></i>
                                                                </button>
                                                                </>
                                                            ) : (
                                                                <button className="negative" id="report-message-btn">
                                                                    <i className="fa-solid fa-bullhorn"></i>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                    <form className="typing-bar" onSubmit={(e) => {
                        e.preventDefault();
                        handleFormSubmit();
                    }}>
                        <input type="text" placeholder="Write your message..." 
                            value={formData.content} 
                            onChange={(e) => handleChange("content", e.target.value)}
                        />
                        <div className="actions">
                            <i className="fa-solid fa-paperclip"></i>
                            <i className="fa-solid fa-microphone"></i>
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