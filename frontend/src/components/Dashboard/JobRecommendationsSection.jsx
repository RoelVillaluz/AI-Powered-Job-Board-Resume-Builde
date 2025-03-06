import { Link } from "react-router-dom"

function JobRecommendationsSection({ jobRecommendations, user, toggleSaveJob }) {

    return (
        <>
            <section className="grid-item" id="job-recommendations">
                <header>
                    <h3>Recommended Jobs</h3>
                </header>
                <ul className="job-list">
                    {jobRecommendations.map((job) => (
                        <li key={job._id} className="job-list-item">
                            <Link to={`jobs/${job._id}`}>
                                <div className="row">
                                    <div className="wrapper">
                                        {job.company.logo ? (
                                            <img src={job.company.logo}></img>
                                        ) : (
                                            <i className="fa-solid fa-building"></i>
                                        )}
                                        <div>
                                            <h4>{job.title}</h4>
                                            <p>{job.company.name}</p>
                                        </div>
                                    </div>
                                        <i className="fa-solid fa-arrow-right"></i>
                                </div>
                                <ul className="tags">
                                    <li>{job.jobType}</li>
                                    <li>{job.experienceLevel}</li>
                                    <li>{job.location}</li>
                                </ul>
                            </Link>
                        </li>
                    ))}
                </ul>
                <Link className="all-jobs-link" to={'jobs'}>See all jobs <i className="fa-solid fa-angle-right"></i></Link>
            </section>
        </>
    )
}

export default JobRecommendationsSection