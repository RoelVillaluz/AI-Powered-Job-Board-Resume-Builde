import { Link } from "react-router-dom"

function NetworkSection() {
    return (
        <section className="grid-item" id="networks">
            <header>
                <h4>Networks</h4>
            </header>
            <ul>
                <li>
                    <img src="public/media/pexels-alipli-15003448.jpg" alt="" />
                    <div className="person-info">
                        <h4>Dj Bombay</h4>
                        <p>UI/UX Designer</p>
                    </div>
                    <button>
                        <i className="fa-solid fa-user-plus" aria-hidden="true"></i>
                    </button>
                </li>
                <li>
                    <img src="public/media/pexels-kampus-6605421.jpg" alt="" />
                    <div className="person-info">
                        <h4>Joe Murray</h4>
                        <p>Backend Developer</p>
                    </div>
                    <button>
                        <i className="fa-solid fa-user-plus" aria-hidden="true"></i>
                    </button>
                </li>
            </ul>
            <Link>Find more<i className="fa-solid fa-arrow-right"></i></Link>
        </section>
    )
}

export default NetworkSection