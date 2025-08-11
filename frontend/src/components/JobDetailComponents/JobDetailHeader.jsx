import { useJobActions } from "../../hooks/jobs/useJobActions"
import { formatDate } from "../utils/dateUtils";

// Separate component for company banner
const CompanyBanner = ({ company, loading }) => {
    if (loading) return <div className="banner"/>

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

const CompanyLogo = () => {
    if (loading) return <i className="fa-solid fa-building"></i>

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

function JobDetailHeader({ user, job, company, currentResume, loading, hasQuestions, showModal }) {
    const { toggleApplyJob, toggleSaveJob } = useJobActions();

    return (
        <header>
            {!loading ? (
                <>                    
                    <CompanyBanner company={company} loading={loading} />

                    <div className="icons">
                        <CompanyLogo company={company} loading={loading}/>
                        <div className="socials">
                            <div className="social-media-icon">
                            <i className="fa-brands fa-facebook"></i>
                            </div>
                            <div className="social-media-icon">
                            <i className="fa-brands fa-linkedin-in"></i>
                            </div>
                            <div className="social-media-icon">
                            <i className="fa-solid fa-share-nodes"></i>
                            </div>
                        </div>
                    </div>
                </>
                ) : (
                <>
                    <div className="banner"></div>
                    <div className="company-logo skeleton"></div>
                </>
            )}
            <div className="job-overview">
                {!loading ? (
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
                        </div>
                        <div className="applicants">
                            {job.applicants.map((applicant, index) => (
                                <img src={`/${applicant.profilePicture}`} key={index}></img>
                            ))}
                            <span>{job.applicants.length} {job.applicants.length !== 1 ? 'Applicants' : 'Applicant'}</span>
                        </div>
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

export default JobDetailheader