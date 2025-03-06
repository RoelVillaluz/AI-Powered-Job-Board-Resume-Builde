import { useState } from "react"

function TopJobSection({ job }) {
    
    return (
        <>
            <section className="grid-item" id="top-job">
                <div className="banner"></div>
                <header>
                    <img src={job.company.logo} alt="" className="company-logo"/>
                    <div className="wrapper">
                        <div>
                            <h3>{job.title}</h3>
                            <p>{job.company.name}</p>
                        </div>
                        <i className="fa-regular fa-bookmark"></i>
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
                            <h3>${job.salary}/<span>Year</span></h3>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default TopJobSection