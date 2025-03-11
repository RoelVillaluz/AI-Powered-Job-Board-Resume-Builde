import { Link } from "react-router-dom"

function JobRecommendationsSection({ jobRecommendations, loading }) {
    return (
        <section className={`grid-item ${loading ? "skeleton" : ""}`} id="job-recommendations">
            {!loading && (
                <>
                    <header>
                        <h3>Recommended Jobs</h3>
                    </header>
                    {jobRecommendations.length > 0 ? (
                        <>
                            <ol className="job-list">
                                {jobRecommendations.map((job) => (
                                    <li key={job._id} className="job-list-item">
                                        <article>
                                            <Link to={`jobs/${job._id}`}>
                                                <div className="row">
                                                    <div className="wrapper">
                                                        {job.company.logo ? (
                                                            <figure>
                                                                <img src={job.company.logo} alt="Company Logo" />
                                                                <figcaption className="sr-only">{job.company.name} logo</figcaption>
                                                            </figure>
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
                                                <div className="tags">
                                                    <span>
                                                        <i className="fa-solid fa-location-dot"></i>
                                                        {job.location}
                                                    </span>
                                                    <span>
                                                        <i className="fas fa-briefcase"></i>
                                                        {job.jobType}
                                                    </span>
                                                    <span>
                                                        <i className="fas fa-user-tie"></i>
                                                        {job.experienceLevel}
                                                    </span>
                                                </div>
                                            </Link>
                                        </article>
                                    </li>
                                ))}
                            </ol>
                            <Link className="all-jobs-link" to={"jobs"}>
                                See all jobs <i className="fa-solid fa-angle-right" aria-hidden="true"></i>
                            </Link>
                        </>
                    ) : (
                        <p role="alert">No jobs yet</p>
                    )}
                </>
            )}
        </section>
    );
}

export default JobRecommendationsSection;