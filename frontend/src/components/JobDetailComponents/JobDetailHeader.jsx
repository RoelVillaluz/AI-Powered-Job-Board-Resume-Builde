import { useJobActions } from "../../hooks/jobs/useJobActions"
import { useJobDetails } from "../../hooks/jobs/useJobDetails";
import { useAuthStore } from "../../stores/authStore";
import { formatDate } from "../utils/dateUtils";
import { useResumeStore } from "../../stores/resumeStore";

const CompanyBanner = ({ company, isLoading }) => {
    if (isLoading) return <div className="banner"/>

    return company.banner ? (
        <img 
            src={`/${company.banner}`} 
            className="company-banner-image" 
            alt={`${company.name} banner`}
            loading="lazy"   
        />
    ) : (
        <div className="banner" />
    );
}

const CompanyLogo = ({ company, isLoading }) => {
    if (isLoading) return <i className="fa-solid fa-building"></i>

    return company.logo ? (
        <img 
            src={`/${company.logo}`} 
            alt={`${company.name} logo`} 
            className="company-logo" 
        />
    ) : (
        <i className="fa-solid fa-building"></i>
    )
}

const SocialMediaLinks = ({ company }) => {
    return (
        <div className="socials">
            <button className="social-media-icon" aria-label={`Visit ${company.name} on Facebook`}>
                <i className="fa-brands fa-facebook"></i>
            </button>
            <button className="social-media-icon" aria-label={`Visit ${company.name} on Linkedin`}>
                <i className="fa-brands fa-linkedin-in"></i>
            </button>
            <button className="social-media-icon" aria-label={`Share ${company.name}`}>
                <i className="fa-solid fa-share-nodes"></i>
            </button>
        </div>
    )
}

const JobActions = ({ job, user, currentResume, toggleApplyJob, toggleSaveJob, hasQuestions, showModal }) => {
    return (
        <div className="actions">
            <button className="apply-btn" onClick={(e) => toggleApplyJob(e, job._id, currentResume._id, hasQuestions, showModal )}>
                {user.appliedJobs.includes(job._id) ? 'Unapply' : 'Apply Now'}
            </button>
            <button className="save-btn" onClick={(e) => toggleSaveJob(e, job._id)} aria-label="Save job">
                <i className={`fa-${user?.savedJobs.includes(job?._id) ? 'solid' : 'regular'} fa-bookmark`}></i>
            </button>
            <button className="settings-btn">
                <i className="fa-solid fa-gear"></i>
            </button>
        </div>
    )
}

const ApplicantsList = ({ job }) => {
    return (
        <div className="applicants">
            {job.applicants.map((applicant, index) => (
                <img src={`/${applicant.profilePicture}`} key={index}></img>
            ))}
            <span>{job.applicants.length} {job.applicants.length !== 1 ? 'Applicants' : 'Applicant'}</span>
        </div>
    )
}

function JobDetailHeader({ jobId, showModal }) {
    const user = useAuthStore(state => state.user);
    const currentResume = useResumeStore(state => state.currentResume);
    const { job, company, isLoading, error, hasQuestions } = useJobDetails(jobId)
    const { toggleApplyJob, toggleSaveJob } = useJobActions();

    
    return (
        <header>
            {!isLoading ? (
                <>                    
                    <CompanyBanner company={company} isLoading={isLoading} />

                    <div className="icons">

                        <CompanyLogo company={company} isLoading={isLoading}/>

                        <SocialMediaLinks company={company}/>
                        
                    </div>
                </>
                ) : (
                <>
                    <div className="banner"></div>
                    <div className="company-logo skeleton"></div>
                </>
            )}
            <div className="job-overview">
                {!isLoading ? (
                    <>
                        <div className="row">
                            <h1>{job?.title}</h1>
                            <span className="posted-at">{formatDate(job.postedAt)}</span>
                            <h2>{job.salary.currency}{job.salary.amount.toLocaleString()}<span>/{job.salary.frequency}</span></h2>
                        </div>
                        <div className="row">
                            <div>
                                <h3>{company?.name}</h3>
                                <h4>{job.location}</h4>
                            </div>
                            
                            <JobActions 
                                job={job} 
                                user={user}
                                company={company} 
                                currentResume={currentResume} 
                                toggleApplyJob={toggleApplyJob}
                                toggleSaveJob={toggleSaveJob}
                                hasQuestions={hasQuestions} 
                                showModal={showModal}
                            />

                        </div>
                        <ApplicantsList job={job}/>
                    </>
                ) : (
                    <>
                        <div className="skeleton-text-group">
                            <div className="skeleton text long"></div>
                            <div className="skeleton text short"></div>
                        </div>
                    </>
                )}
            </div>
        </header>
    )
}

export default JobDetailHeader