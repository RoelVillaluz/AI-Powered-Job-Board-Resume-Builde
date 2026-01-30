import { useJobDetails } from "../../hooks/jobs/useJobDetails"

function JobHighlights({ jobId }) {
    const { job, company, isLoading, error } = useJobDetails(jobId);

    return (
        <section className="job-highlights">
            <ul>
                {!isLoading ? (
                    <>
                        <li>
                            <i className="fa-solid fa-user-tie" aria-hidden="true"></i>
                            <div>
                                <h5>Experience Level</h5>
                                <h3>{job.experienceLevel}</h3>
                            </div>
                        </li>
                        <li>
                            <i className="fa-solid fa-briefcase" aria-hidden="true"></i>
                            <div>
                                <h5>Job Type</h5>
                                <h3>{job.jobType}</h3>
                            </div>
                        </li>
                        <li>
                            <i className="fa-solid fa-house-laptop" aria-hidden="true"></i>
                            <div>
                                <h5>Work Setup</h5>
                                <h3>Remote</h3>
                            </div>
                        </li>
                        <li>
                            <i className="fa-solid fa-industry" aria-hidden="true"></i>
                            <div>
                                <h5>Industry</h5>
                                <h3>{company.industry[0]}</h3>
                            </div>
                        </li>
                    </>
                ) : (
                    new Array(4).fill(null).map((_, index) => (
                        <li className="skeleton" key={index}></li>
                    ))                                   
                )}
            </ul>
        </section>
    )
}

export default JobHighlights