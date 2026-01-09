import { useState, useEffect } from "react"
import { useJobActions } from "../../hooks/jobs/useJobActions";
import { Link } from "react-router-dom";
import { useJobStore } from "../../stores/jobStore"; 
import { useResumeStore } from "../../stores/resumeStore";
import { useAuthStore } from "../../stores/authStore"; // Add this import
import { formattedSalary } from "../../../../backend/constants";

function TopJobSection() {
    const { toggleApplyJob, toggleSaveJob } = useJobActions();
    const user = useAuthStore(state => state.user); // Get user from store

    const jobRecommendations = useJobStore(state => state.jobRecommendations);
    const fetchJobRecommendations = useJobStore(state => state.fetchJobRecommendations);
    
    const isJobLoading = useJobStore(state => state.isLoading); // Rename to avoid conflict
    const resume = useResumeStore(state => state.currentResume);
    
    const [topJob, setTopJob] = useState(null);
    const [shuffledSkills, setShuffledSkills] = useState([]);

    // Fetch recommendations on mount
    useEffect(() => {
        if (user?._id) {
            fetchJobRecommendations(user._id);
        }
    }, [user?._id, fetchJobRecommendations]);

    // Set top job when recommendations are loaded
    useEffect(() => {
        if (jobRecommendations.length > 0) {
            setTopJob(jobRecommendations[0]);
        } else {
            setTopJob(null);
        }
    }, [jobRecommendations]);

    // Shuffle skills only once
    useEffect(() => {
        if (resume?.skills?.length) {
            const shuffled = resume.skills
                .sort(() => Math.random() - 0.5)
                .slice(0, 3)
                .map(skill => skill.name)
                .join(", ");
            setShuffledSkills(shuffled);
        }
    }, [resume]);
    
    return (
        <>
            <section className={`grid-item ${!isJobLoading && topJob ? '' : 'skeleton'}`} id="top-job">
                {!isJobLoading && topJob && user && (
                    <>
                        <Link to={`job-postings/${topJob._id}`} id="top-job-link">
                            <header>
                                <div>
                                    <h1>{topJob.title || 'Full Stack Developer'}</h1>
                                    <h2>{topJob.company?.name}</h2>
                                </div>
                                {topJob.company?.logo && (
                                    <img src={topJob.company.logo} alt={`${topJob.company.name} logo`} />
                                )}
                            </header>
                            <div className="details">

                                <h4>{formattedSalary(topJob)}</h4>
    
                                <div className="tags-list">
                                    <div className="tag-item">
                                        <i className="fa-solid fa-location-dot" aria-hidden="true"></i>
                                        <span>{topJob.location}</span>
                                    </div>
                                    <div className="tag-item">
                                        <i className="fa-solid fa-briefcase" aria-hidden="true"></i>
                                        <span>{topJob.jobType}</span>
                                    </div>
                                    <div className="tag-item">
                                        <i className="fa-solid fa-user-tie" aria-hidden="true"></i>
                                        <span>{topJob.experienceLevel}</span>
                                    </div>
                                    {topJob.matchedSkills && topJob.skills && (
                                        <div className="tag-item">
                                            <i className="fa-solid fa-wrench" aria-hidden="true"></i>
                                            <span>{topJob.matchedSkills.length}/{topJob.skills.length} Matched Skills</span>
                                        </div>
                                    )}
                                </div>

                                <div className="actions">

                                    <button 
                                        className="apply-btn" 
                                        onClick={(e) => toggleApplyJob(e, topJob._id, resume)} 
                                        aria-label="Apply to job"
                                    >
                                        {user.appliedJobs?.includes(topJob._id) ? 'Unapply': 'Apply Now'}
                                    </button>

                                    <button 
                                        className="save-btn" 
                                        onClick={(e) => toggleSaveJob(e, topJob._id)} 
                                        aria-label="Save job"
                                    >
                                        <i className={`fa-${user.savedJobs?.includes(topJob._id) ? 'solid': 'regular'} fa-bookmark`}></i>
                                    </button>

                                    {topJob.similarity && (
                                        <div className="match-score">
                                            {topJob.similarity}% Match
                                        </div>
                                    )}

                                </div>
                            </div>
                        </Link>
                        <Link id="recommended-jobs-link" to={'job-postings/'}>
                            <div className="company-images">
                                <img src="public/company_logos/apple.jpg" alt="Company logo" />
                                <img src="public/company_logos/netflix.jpg" alt="Company logo" />
                                <img src="public/company_logos/meta.jpg" alt="Company logo" />
                            </div>
                            <div className="wrapper">
                                <div>
                                    <h3>Recommended Jobs For You</h3>
                                    <p>{shuffledSkills}</p>
                                </div>
                                <i className="fa-solid fa-angle-right"></i>
                            </div>
                        </Link>
                    </>
                )}
            </section>
        </>
    )
}

export default TopJobSection