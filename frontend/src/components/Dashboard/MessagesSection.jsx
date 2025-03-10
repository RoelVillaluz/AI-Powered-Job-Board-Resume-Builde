import { Link } from "react-router-dom"

function MessagesSection({ loading }) {
    return(
        <>
            <section className={`grid-item ${loading !== true ? '' : 'skeleton'}`} id="messages">
                {loading !== true && (
                    <>
                        <header>
                            <h4>Messages (2)</h4>
                        </header>
                        <ul className="message-list">
                            <li>
                                <Link>
                                    <img src="public/media/pexels-alipli-15003448.jpg" alt="" /> 
                                    <div className="details">
                                        <div className="row">
                                            <h5>Joe Murray</h5>
                                            <span className="message-count">1</span>
                                            <span>4h</span>
                                        </div>
                                        <p>Hi, I hope you are doing well, I saw your application</p>
                                    </div>
                                </Link>
                            </li>
                            <li>
                                <Link>
                                    <img src="public/media/pexels-anthonyshkraba-production-8278885.jpg" alt="" /> 
                                    <div className="details">
                                        <div className="row">
                                            <h5>Mr. Panda</h5>
                                            <span className="message-count">2</span>
                                            <span>12h</span>
                                        </div>
                                        <p>Hello, I am Mr. Panda, nice to meet you.</p>
                                    </div>
                                </Link>
                            </li>
                        </ul>
                        <Link to={'/messages'} className="all-messages-link">View all messages <i className="fa-solid fa-angle-right"></i></Link>
                    </>
                )}
            </section>
        </>
    )
}

export default MessagesSection