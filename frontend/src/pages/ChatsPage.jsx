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
                    <div className="typing-bar">
                        <input type="text" placeholder="Write your message..."/>
                        <div className="actions">
                            <i className="fa-solid fa-paperclip"></i>
                            <i className="fa-solid fa-microphone"></i>
                            <i className="fa-solid fa-paper-plane"></i>
                        </div>
                    </div>
                </section>

            </main>
        </Layout>
    )
}

export default ChatsPage