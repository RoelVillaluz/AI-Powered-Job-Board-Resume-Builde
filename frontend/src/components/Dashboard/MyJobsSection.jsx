import { Link } from "react-router-dom"

function MyJobsSection() {
    return (
        <>
        <section className="grid-item" id="my-jobs">
            <header>
                <h3>My Jobs</h3>
            </header>
            <ul>
                <li>
                    <Link to={'/my-jobs/saved'}>
                        <div className="row">
                            <i className="fa-regular fa-bookmark"></i>
                            <span>Saved</span>
                        </div>
                        <div className="wrapper">
                            <p>0</p>
                            <i className="fa-solid fa-angle-right"></i>
                        </div>
                    </Link>
                </li>
                <li>
                    <Link to={'/my-jobs/applied'}>
                        <div className="row">
                            <i className="fa-solid fa-file-invoice"></i>
                            <span>Applied</span>
                        </div>
                        <div className="wrapper">
                            <p>0</p>
                            <i className="fa-solid fa-angle-right"></i>
                        </div>
                    </Link>
                </li>

                <li>
                    <Link to={'/my-jobs/accepted'}>
                        <div className="row">
                            <i className="fa-solid fa-briefcase"></i>
                            <span>Accepted</span>
                        </div>
                        <div className="wrapper">
                            <p>0</p>
                            <i className="fa-solid fa-angle-right"></i>
                        </div>
                    </Link>
                </li>
            </ul>
        </section>
        </>
    )
}

export default MyJobsSection