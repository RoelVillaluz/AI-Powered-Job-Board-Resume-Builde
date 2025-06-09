import { useEffect } from "react"
import Layout from "../components/Layout"

function ChatsPage() {
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

                </aside>

            </main>
        </Layout>
    )
}

export default ChatsPage