import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../AuthProvider";

function GoalsSection({ loading }) {
    const { user } = useAuth();

    return (
        <>
            <section className="grid-item" id="goals">
                {!loading && (
                    <Link to="/goals">
                        <header>
                            <h5>Your goals</h5>
                        </header>
                        <div className="progress">
                            <div className="goal-name">
                                <i className="fa-solid fa-file-lines"></i>
                                <h4>Applications sent</h4>
                                <h1>{user?.appliedJobs.length}<span>/15</span></h1>
                            </div>
                            <div className="progress-bar">
                                <div className="fill"></div>
                            </div>
                        </div>
                    </Link>
                )}
            </section>
        </>
    )
}

export default GoalsSection