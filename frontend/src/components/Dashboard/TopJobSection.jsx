import { useState, useEffect } from "react"
import { useAuth } from "../AuthProvider";
import { Link } from "react-router-dom";
import { useData } from "../../DataProvider";

function TopJobSection({ user, resume }) {
    const { toggleApplyJob, toggleSaveJob } = useAuth();
    const { fetchJobRecommendations } = useData();
    const [topJob, setTopJob] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getRecommendations = async () => {
            if (!resume) return; // Ensure resume exists

            setLoading(true); // Start loading when fetching data
            const recommendations = await fetchJobRecommendations();
            console.log("Received recommendations:", recommendations);
            
            if (recommendations.length > 0) {
                setTopJob(recommendations[0]); // Set the first job recommendation
            } else {
                setTopJob(null); // Ensure no stale data
            }
        };

        getRecommendations();
    }, [resume]);

    // Stop loading when topJob is set
    useEffect(() => {
        if (topJob !== null) {
            setLoading(false);
        }
    }, [topJob]);
    

    const formatDate = (date) => {
        const formattedDate = date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        return formattedDate
    }
    
    return (
        <>
            <section className={`grid-item ${!loading ? '' : 'skeleton'}`} id="top-job">
                {!loading && (
                    <>
                        <Link to={`job-postings/${topJob._id}`} id="top-job-link">
                            <header>
                                <div>
                                    <h1>Full Stack Developer</h1>
                                    <h2>{topJob.company.name}</h2>
                                </div>
                                <img src={topJob.company.logo} alt={`${topJob.company.name} logo`} />
                            </header>
                            <div className="details">

                                <h4>${topJob.salary}/year</h4>
    
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
                                    <div className="tag-item">
                                        <i className="fa-solid fa-wrench" aria-hidden="true"></i>
                                        <span>{topJob.matchedSkills.length}/{topJob.skills.length} Matched Skills</span>
                                    </div>
                                </div>

                                <div className="actions">

                                    <button id="apply-btn" onClick={(e) => toggleApplyJob(e, topJob._id, resume)} aria-label="Apply to job">
                                        {user.appliedJobs.some(application => application.jobPosting._id === topJob._id) ? 'Unapply': 'Apply Now'}
                                    </button>

                                    <button id="save-btn" onClick={(e) => toggleSaveJob(e, topJob._id)} aria-label="Save job">
                                        <i className={`fa-${user.savedJobs.includes(topJob._id) ? 'solid': 'regular'} fa-bookmark`}></i>
                                    </button>

                                    <div className="match-score">
                                        {topJob.similarity}% Match
                                    </div>

                                </div>
                            </div>
                        </Link>
                        <Link id="recommended-jobs-link" to={'job-postings/'}>
                            <div className="company-images">
                                <img src="public/company_logos/apple.jpg" alt="" />
                                <img src="public/company_logos/netflix.jpg" alt="" />
                                <img src="public/company_logos/meta.jpg" alt="" />
                            </div>
                            <div className="wrapper">
                                <div>
                                    <h3>Recommended Jobs For You</h3>
                                    <p>{resume.skills
                                                    .sort(() => Math.random() - 0.5)
                                                    .slice(0, 3)
                                                    .map(skill => skill.name)
                                                    .join(', ')}</p>
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