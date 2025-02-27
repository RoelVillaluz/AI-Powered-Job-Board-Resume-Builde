import { Link } from "react-router-dom"

function MyJobsSection() {
    return (
        <>
        <section className="grid-item" id="my-jobs">
            <header>
                <h3>My Jobs</h3>
                <Link>
                    <i className="fa-solid fa-angle-right"></i>
                </Link>
            </header>
            <ul>
                <Link to={'/my-jobs/saved'}>
                    <li>
                        <div className="row">
                            <i className="fa-solid fa-bookmark"></i>
                            <div>
                                <strong>Saved</strong>
                                <p>(0) jobs</p>
                            </div>
                        </div>
                        <i className="fa-solid fa-angle-right"></i>
                    </li>
                </Link>
                <Link to={'/my-jobs/applied'}>
                    <li>
                        <div className="row">
                            <i className="fa-solid fa-file-invoice"></i>
                            <div>
                                <strong>Applied</strong>
                                <p>(0) jobs</p>
                            </div>
                        </div>
                        <i className="fa-solid fa-angle-right"></i>
                    </li>
                </Link>
                <Link to={'/my-jobs/interviews'}>
                    <li>
                        <div className="row">
                            <i className="fa-solid fa-clipboard-question"></i>
                            <div>
                                <strong>Interviews</strong>
                                <p>(0) jobs</p>
                            </div>
                        </div>
                        <i className="fa-solid fa-angle-right"></i>
                    </li>
                </Link>
                <Link to={'/my-jobs/offers'}>
                    <li>
                        <div className="row">
                            <i className="fa-solid fa-briefcase"></i>
                            <div>
                                <strong>Offers</strong>
                                <p>(0) jobs</p>
                            </div>
                        </div>
                        <i className="fa-solid fa-angle-right"></i>
                    </li>
                </Link>
            </ul>
        </section>  
        </>
    )
}

export default MyJobsSection