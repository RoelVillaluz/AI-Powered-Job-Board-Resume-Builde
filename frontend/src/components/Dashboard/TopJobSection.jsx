import { useState } from "react"

function TopJobSection({ job, user, toggleSaveJob, loading }) {
    return (
        <>
            <section className={`grid-item ${loading !== true ? '' : 'skeleton'}`} id="top-job">
                {loading !== true && (
                    <>
                    <div className="banner"></div>
                        <header>
                            <img src={job.company.logo} alt="" className="company-logo"/>
                            <div className="wrapper">
                                <div>
                                    <h3>{job.title}</h3>
                                    <p>{job.company.name}</p>
                                </div>
                                <i className={`fa-${user.savedJobs.includes(job._id) ? 'solid' : 'regular'} fa-bookmark` }onClick={(e) => toggleSaveJob(e, job._id)}></i>
                            </div>
                        </header>
                        <div className="details">
                            <div>
                                <div className="applicants-list">
                                <img src="public/media/pexels-alipli-15003448.jpg" alt="" /> 
                                <img src="public/media/pexels-anthonyshkraba-production-8278885.jpg" alt="" />
                                <img src="public/media/pexels-visoesdomundo-3586798.jpg" alt="" />
                                <strong>14+ Applied</strong>
                                </div>
                                <div className="tags">
                                    <li><i class="fa-solid fa-location-dot"></i>{job.location}</li>
                                    <li><i class="fas fa-briefcase"></i>{job.jobType}</li>
                                    <li><i className="fas fa-user-tie"></i>{job.experienceLevel}</li>
                                </div>
                            </div>
                            <div className="row">
                                <div className="match-score">
                                    <span>{job.similarity}</span>
                                    <div>
                                        <h6>Match Score</h6>
                                        <p>You're a perfect fit</p>
                                    </div>
                                </div>
                                <div className="salary">
                                    <h3>${job.salary}/<span>year</span></h3>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </>
    )
}

export default TopJobSection