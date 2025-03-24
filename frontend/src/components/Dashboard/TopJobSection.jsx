import { useState } from "react"
import { useAuth } from "../AuthProvider";

function TopJobSection({ job, user, resume, loading }) {
    const { toggleApplyJob } = useAuth();
    return (
        <>
            <section className={`grid-item ${!loading ? '' : 'skeleton'}`} id="top-job">
                {!loading && (
                    <>
                        <Link to={`jobs/${job._id}`}>
                        <header>
                                <div>
                                    <h1>Full Stack Developer</h1>
                                    <h2>{job.company.name}</h2>
                                </div>
                                <img src={job.company.logo} alt={`${job.company.name} logo`} />
                        </header>
                        <div className="details">

                                <h4>${job.salary}/year</h4>
    
                                <div className="tags-list">
                                    <div className="tag-item">
                                        <i className="fa-solid fa-location-dot" aria-hidden="true"></i>
                                        <span>{job.location}</span>
                                    </div>
                                    <div className="tag-item">
                                        <i className="fa-solid fa-briefcase" aria-hidden="true"></i>
                                        <span>{job.jobType}</span>
                                    </div>
                                    <div className="tag-item">
                                        <i className="fa-solid fa-user-tie" aria-hidden="true"></i>
                                        <span>{job.experienceLevel}</span>
                                    </div>
                                    <div className="tag-item">
                                        <i className="fa-solid fa-wrench" aria-hidden="true"></i>
                                        <span>{job.matchedSkills.length}/{job.skills.length} Matched Skills</span>
                                </div>
                                </div>

                                <div className="actions">

                                    <button id="apply-btn" onClick={(e) => toggleApplyJob(e, job._id, resume)} aria-label="Apply to job">
                                        {user.appliedJobs.some(application => application.jobPosting._id === job._id) ? 'Unapply': 'Apply Now'}
                                    </button>

                                    <button id="save-btn" aria-label="Save job">
                                        <i className="fa-regular fa-bookmark"></i>
                                    </button>

                                <div className="match-score">
                                        {job.similarity}% Match
                                    </div>

                                </div>
                            </div>
                        </Link>
                        More Jobs
                    </>
                )}
            </section>
        </>
    )
}

export default TopJobSection