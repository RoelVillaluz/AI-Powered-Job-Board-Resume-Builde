function MessagesSection() {
    return(
        <>
            <section className="grid-item" id="messages">
                <header>
                    <h3>Messages</h3>
                </header>
                <ul className="message-list">
                    <li>
                        <img src="public/media/pexels-alipli-15003448.jpg" alt="" />
                        <div className="message-details">
                            <div className="wrapper">
                                <span>Apu Nahasapeemapetilon</span>
                                <p>11:00 AM</p>
                            </div>
                            <p>Hello, I saw your application</p>
                        </div>
                    </li>
                    <li>
                        <img src="public/media/pexels-alipli-15003448.jpg" alt="" />
                        <div className="message-details">
                            <div className="wrapper">
                                <span>Apu Nahasapeemapetilon</span>
                                <p>11:00 AM</p>
                            </div>
                            <p>Hello, I saw your application and i am very bababooey haha skibidi wawa wiwa</p>
                        </div>
                    </li>
                </ul>
            </section>
        </>
    )
}

export default MessagesSection