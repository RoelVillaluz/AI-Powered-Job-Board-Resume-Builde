function ChatResources() {
    return (
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
    )
}

export default ChatResources