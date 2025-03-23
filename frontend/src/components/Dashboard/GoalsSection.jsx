import { Link } from "react-router-dom"

function GoalsSection() {
    return (
        <>
            <section className="grid-item" id="goals">
                <Link to="/goals">
                    <header>
                        <h5>Your goals</h5>
                    </header>
                    <div className="progress">
                        <div className="goal-name">
                            <i className="fa-solid fa-file-lines"></i>
                            <h4>Applications sent</h4>
                            <h1>7<span>/15</span></h1>
                        </div>
                        <div className="progress-bar">
                            <div className="fill"></div>
                        </div>
                    </div>
                </Link>
            </section>
        </>
    )
}

export default GoalsSection