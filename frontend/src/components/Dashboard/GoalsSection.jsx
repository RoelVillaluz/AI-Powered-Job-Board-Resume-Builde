import { Link } from "react-router-dom"
import { useAuthStore } from "../../stores/authStore";

function GoalsSection() {
    const user = useAuthStore(state => state.user);
    const isLoading = useAuthStore(state => state.isLoading);

    return (
        <>
            <section className="grid-item" id="goals">
                {!isLoading && (
                    <Link to="/goals">
                        <header>
                            <h5>Your goals</h5>
                        </header>
                        <div className="progress">
                            <div className="goal-name">
                                <i className="fa-solid fa-file-lines"></i>
                                <h4>Applications sent</h4>
                                <h1>{user?.appliedJobs?.length}<span>/15</span></h1>
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