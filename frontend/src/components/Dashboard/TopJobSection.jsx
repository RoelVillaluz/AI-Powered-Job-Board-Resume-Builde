import { useState } from "react"
import { useAuth } from "../AuthProvider";

function TopJobSection({ job, user, resume, loading }) {
    const { toggleApplyJob } = useAuth();

    return (
        <>
            <section className={`grid-item ${!loading ? '' : 'skeleton'}`} id="top-job">
                {!loading && (
                    <>
                    <div className="banner"></div>
                        <header>
                            <img src={job.company.logo} alt="" className="company-logo"/>
                            <div className="wrapper">
                                <div>
                                    <h3>{job.title}</h3>
                                    <p>{job.company.name}</p>
                                </div>
                                <button onClick={(e) => toggleSaveJob(e, job._id)} aria-label="Save job">
                                    <i className={`fa-${user.savedJobs.includes(job._id) ? 'solid' : 'regular'} fa-bookmark`}></i>
                                </button>
                            </div>
                        </header>
                        <div className="details">
                            <div>
                                <div className="applicants-list">
                                <img src="public/media/pexels-alipli-15003448.jpg" alt="applicant-1"/> 
                                <img src="public/media/pexels-anthonyshkraba-production-8278885.jpg" alt="applicant-2"/>
                                <img src="public/media/pexels-visoesdomundo-3586798.jpg" alt="applicant-3"/>
                                <span className="applicant-count">14+ Applied</span>
                                </div>
                                <div className="tags">
                                    <span><i className="fa-solid fa-location-dot"></i>{job.location}</span>
                                    <span><i className="fas fa-briefcase"></i>{job.jobType}</span>
                                    <span><i className="fas fa-user-tie"></i>{job.experienceLevel}</span>
                                </div>
                            </div>
                            <div className="row">
                                <div className="match-score">
                                    <strong>{job.similarity}</strong>
                                    <div>
                                        <h6>Match Score</h6>
                                        <p>You're a perfect fit</p>
                                    </div>
                                </div>
                                <span className="salary">
                                    <h3>${job.salary} <span>per year</span></h3>
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </>
    )
}

export default TopJobSection