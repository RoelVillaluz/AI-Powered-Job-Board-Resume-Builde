import { useEffect } from "react"
import Layout from "../components/Layout"

function ChatsPage() {
    useEffect(() => {
        document.title = 'Messages'
    }, [])

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