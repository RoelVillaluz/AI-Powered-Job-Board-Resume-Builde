import { Link } from "react-router-dom"

function JobRecommendationsSection({ jobRecommendations, user, toggleSaveJob }) {
    return (
        <>
            <section className="grid-item" id="job-recommendations">
                <header>
                    <h3>Recommended Jobs ({jobRecommendations.length})</h3>
                </header>
                <ul className="job-list">
                    {jobRecommendations.map((job) => (
                        <li key={job._id} className="recommended-job">
                            <Link to={`/jobs/${job._id}`}>
                                <div className="row">
                                    <div className="wrapper">
                                        {job.company.logo 
                                            ? (
                                                <img></img>
                                            ) : (
                                                <i className="fa-solid fa-building" id="company-logo"></i>
                                        )}
                                        <div className="details">
                                            <strong>{job.title}</strong>
                                            <p>{job.company.name}</p>
                                        </div>
                                    </div>
                                    <button id="save-job-btn" onClick={(e) => toggleSaveJob(e, job._id)}>
                                        <i className={
                                            `fa-${user.savedJobs.includes(job._id) ? 'solid' : 'regular'} fa-bookmark`}>
                                        </i>
                                    </button>
                                </div>
                                <ul className="tags">
                                    {job.matchedSkills.slice(0, 3).map((skill, index) => (
                                        <li key={index} className="matched">{skill}</li>
                                    ))}
                                    {job.matchedSkills.length > 3 && (
                                        <li className="matched">+{job.matchedSkills.length - 3}</li>
                                    )}
                                </ul>
                            </Link>
                        </li>
                    ))}
                </ul>
            </section>
        </>
    )
}

export default JobRecommendationsSection