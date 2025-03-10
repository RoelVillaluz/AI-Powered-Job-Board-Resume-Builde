import { Link } from "react-router-dom"

function MyJobsSection() {
    return (
        <>
        <section className="grid-item" id="my-jobs">
            <ul>
                <li>
                    <Link to={'/my-jobs/accepted'}>
                        <i className="fa-regular fa-handshake"></i>
                        <div className="details">
                            <h4>Accepted</h4>
                            <span>0</span>
                        </div>
                    </Link>
                </li>
                <li>
                    <Link to={'/my-jobs/in-progress'}>
                        <i className="fa-solid fa-bars-progress"></i>
                        <div className="details">
                            <h4>In Progress</h4>
                            <span>0</span>
                        </div>
                    </Link>
                </li>
                <li>
                    <Link to={'/my-jobs/saved'}>
                        <i className="fa-regular fa-bookmark"></i>
                        <div className="details">
                            <h4>Saved</h4>
                            <span>0</span>
                        </div>
                    </Link>
                </li>
                <li>
                    <Link to={'/my-jobs/applied'}>
                        <i className="fa-regular fa-file-alt"></i>
                        <div className="details">
                            <h4>Applied</h4>
                            <span>0</span>
                        </div>
                    </Link>
                </li>
            </ul>
        </section>
        </>
    )
}

export default MyJobsSection