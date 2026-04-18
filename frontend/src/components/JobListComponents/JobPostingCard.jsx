import { Link } from "react-router-dom"
import { useAuth } from "../../contexts/AuthProvider";
import { formattedSalary } from "../../../../backend/constants";
import { useMemo } from "react";
import { useJobActions } from "../../hooks/jobs/useJobActions";
import React from "react";
import { formatSalary } from "../utils/chats/salaryUtils";

export const JobPostingCardSkeleton = () => {
    return (
        <div className="skeleton card"></div>
    )
}

const JobPostingCard = ({ job, user, resume, onShowModal }) => {
    const { toggleSaveJob, toggleApplyJob } = useJobActions();

    const appliedJobs = user?.appliedJobs || [];
    const savedJobs = user?.savedJobs || [];

    const isApplied = useMemo(() => appliedJobs.includes(job._id), [appliedJobs, job._id]);
    const appliedJobText = useMemo(() => (isApplied ? "Unapply" : "Apply"), [isApplied]);


    const hasQuestions = Array.isArray(job.preScreeningQuestions)
        && job.preScreeningQuestions.length > 0;

    const handleApplyClick = (e) => {
        e.preventDefault();

        if (hasQuestions && !user.appliedJobs.includes(job._id)) {
            onShowModal(job, hasQuestions, e); // Pass the click event
        } else {
            toggleApplyJob(e, job._id, resume, hasQuestions);
        }
    };

    
    return (
        <li className="job-card">
            <Link to={`/job-postings/${job._id}`}>
                <div className="wrapper">
                    {job.company.logo ? (
                        <img src={job.company.logo} alt="" />
                    ) : (
                        <div className="icon-box">
                            <i className="fa-solid fa-building"></i>
                        </div>
                    )}
                    <div>
                        <h2>{typeof job.title === 'string' ? job.title : job.title.name || ""}</h2>
                        <h3>{job.company.name}</h3>
                    </div>
                </div>
                <h4>
                    <i className="fa-regular fa-money-bill-1"></i>
                    {job.salary.min && job.salary.max
                        ? formatSalary(job.salary)  // Use the new schema format with min and max
                        : formattedSalary(job)      // Use the old schema format with amount only
                    }
                </h4>
                <p>{job.summary}</p>

                <div className="details">
                    <div className="tags-list">
                        <div className="tag-item">
                            <i className="fa-solid fa-location-dot" aria-hidden="true"></i>
                            <span><h4>{typeof job.location === 'string' ? job.location : job.location.name || ""}</h4></span>
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

                <button className="apply-btn" onClick={handleApplyClick}>{appliedJobText}</button>
                <button className="save-btn" onClick={(e) => toggleSaveJob(e, job._id)} aria-label="Save job">
                    <i className={`fa-${savedJobs.includes(job._id) ? 'solid' : 'regular'} fa-bookmark`}></i>
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

export default React.memo(JobPostingCard)