import { Link } from "react-router-dom"
import { useAuth } from "./AuthProvider"
import { formattedSalary } from "../../../backend/constants";

const JobPostingCard = ({ job, user }) => {
    const { toggleSaveJob } = useAuth();
    
    return (
        <li className="job-card">
            <Link to={`/job-postings/${job._id}`}>
                <div className="wrapper">
                    {job.company.logo ? (
                        <img src={job.company.logo} alt="" />
                    ) : (
                        <i className="fa-solid fa-building"></i>
                    )}
                    <div>
                        <h2>{job.title}</h2>
                        <h3>{job.company.name}</h3>
                    </div>
                </div>
                <h4><i className="fa-regular fa-money-bill-1"></i> {formattedSalary(job)}</h4>
                <p>{job.summary}</p>

                <div className="details">
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
                    </div>
                    
                    <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Iste, veniam labore! Aspernatur culpa alias illum autem ipsa harum laudantium adipisci omnis minus quibusdam similique, eveniet accusantium excepturi aliquam a praesentium!</p>

                </div>

            </Link>

            <div className="actions">

                <button className="apply-btn">Apply</button>
                <button className="save-btn" onClick={(e) => toggleSaveJob(e, job._id)} aria-label="Save job">
                    <i className={`fa-${user.savedJobs.includes(job._id) ? 'solid' : 'regular'} fa-bookmark`}></i>
                </button>
                {job.similarity && (
                    <div className="match-score">
                        {job.similarity}% Match
                    </div>
                )}

            </div>

        </li>
    )
}

export default JobPostingCard