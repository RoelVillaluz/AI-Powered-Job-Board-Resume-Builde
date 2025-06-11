import { useEffect } from "react"
import Layout from "../components/Layout"
import { useAuth } from "../components/AuthProvider"

function ChatsPage() {
    const { user } = useAuth();

    useEffect(() => {
        document.title = 'Messages'
    }, [])

    const sampleMessages = [
        {
            name: 'Ava Carter',
            imageSrc: '/media/pexels-felix-young-449360607-32448620.jpg',
            content: 'Hello, I saw your job application',
            time: '3:18 PM' 
        },
        {
            name: 'Joe Murray',
            imageSrc: '/media/pexels-nappy-936117.jpg',
            content: 'Hello, I hope you are doing well',
            time: '11:23 AM',
        },
        {
            name: 'Jasmine Reed',
            imageSrc: '/media/pexels-mikhail-nilov-7736027.jpg',
            content: 'Good morning. I hope this message finds you well.',
            time: '9:42 AM',
        },
    ]

    const sampleChatWindowMessages = [
        {
            sender: 'Ava Carter',
            imageSrc: '/media/pexels-felix-young-449360607-32448620.jpg',
            content: 'Hello, I saw your job application',
            time: '3:18 PM' 
        },
        {
            sender: 'Me',
            imageSrc: user.profilePicture,
            content: 'Hello, thank you for taking your time reading my application',
            time: '3:51 PM',
        },
        {
            sender: 'Me',
            imageSrc: user.profilePicture,
            content: 'I am very interested in this position, however I am currently taking my final project in college which will make me busy.',
            time: '3:51 PM',
        },
        {
            sender: 'Ava Carter',
            imageSrc: '/media/pexels-felix-young-449360607-32448620.jpg',
            content: 'What the joma-hell!',
            time: '3:18 PM' 
        },
        {
            sender: 'Ava Carter',
            imageSrc: '/media/pexels-felix-young-449360607-32448620.jpg',
            content: 'Nuh uh, hell no-mari!',
            time: '3:18 PM' 
        },
    ]

    const groupMessages = (messages) => {
        const grouped = [];
        let currentGroup = null;
        
        messages.forEach((message, index) => {
            const prevMessage = messages[index - 1];
            
            // Check if this message should be grouped with the previous one
            const shouldGroup = prevMessage && 
                            prevMessage.sender === message.sender &&
                            shouldGroupByTime(prevMessage.time, message.time);
            
            if (shouldGroup) {
                // Add to existing group
                currentGroup.messages.push(message);
            } else {
                // Start new group
                currentGroup = {
                    sender: message.sender,
                    imageSrc: message.imageSrc,
                    time: message.time,
                    messages: [message]
                };
                grouped.push(currentGroup);
            }
        });
        
        return grouped;
    };

    const shouldGroupByTime = (time1, time2) => {
        const parseTime = (timeStr) => {
            const [time, period] = timeStr.split(' ')
            let [hours, minutes] = time.split(':').map(Number)

            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            
            return hours * 60 + minutes; // Convert to minutes
        }

        const time1Minutes = parseTime(time1);
        const time2Minutes = parseTime(time2);
        
        // Group messages within 1 minute of each other
        return Math.abs(time2Minutes - time1Minutes) <= 1;
    }

   const groupedMessages = groupMessages(sampleChatWindowMessages);

    return (
        <Layout>
            <main className="main-content" id="chats-page">

                {/* Chat List */}
                <aside id="chat-sidebar">

                    <header>
                        <i className="fa-solid fa-angle-left"></i>
                        <h1>My Chats</h1>
                    </header>

                    <section id="user-summary">
                        <i className="fa-solid fa-gear"></i>
                        <figure className="user-avatar">
                            <img src="/media/pexels-felix-young-449360607-32448620.jpg" alt="" />
                            <span className="status-circle active"></span>
                        </figure>
                        <h1>Ava Carter</h1>
                        <h3 className="status-text active">Online</h3>
                    </section>

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
                            {sampleMessages.map((message, index) => (
                                <li className="message-preview" key={index}>
                                    <img src={message.imageSrc} alt="" />
                                    <div className="message-details">
                                        <div className="row">
                                            <strong>{message.name}</strong>
                                            <time datetime="">{message.time}</time>
                                        </div>
                                        <span class="message-content">{message.content}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        
                    </section>

                </aside>

                {/* Current Chat Window */}
                <section className="chat-window">
                    <header>
                        <div className="user">
                            <img src="/media/pexels-felix-young-449360607-32448620.jpg" alt="" />
                            <address>
                                <strong>Ava Carter</strong>
                                <span>avacarter@apple.com</span>
                            </address>
                        </div>
                        <div className="actions">
                            <i className="fa-solid fa-phone"></i>
                            <i className="fa-solid fa-video"></i>
                            <i className="fa-solid fa-ellipsis"></i>
                        </div>
                    </header>
                    <div className="messages-container">
                        <ul>
                            {groupedMessages.map((group, groupIndex) => (
                                <li className={group.sender === 'Me' ? 'receiver' : ''} key={groupIndex}>
                                    <img src={group.imageSrc} alt="" />
                                    <div className="message-group">
                                        <time datetime="">{group.time}</time>
                                        <div className="messages">
                                            {group.messages.map((message, messageIndex) => (
                                                <p key={messageIndex}>{message.content}</p>
                                            ))}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <form className="typing-bar">
                        <input type="text" placeholder="Write your message..."/>
                        <div className="actions">
                            <i className="fa-solid fa-paperclip"></i>
                            <i className="fa-solid fa-microphone"></i>
                            <i className="fa-solid fa-paper-plane"></i>
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