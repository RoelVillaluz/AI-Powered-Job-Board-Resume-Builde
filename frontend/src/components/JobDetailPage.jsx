import { useEffect, useState } from "react"
import Layout from "./Layout"
import axios from "axios";
import { useData } from "../DataProvider";
import { useParams } from "react-router-dom";
import { faL } from "@fortawesome/free-solid-svg-icons";
import Resume from "../../../backend/models/resumeModel";
import { useAuth } from "./AuthProvider";
import Gauge from "./Gauge";

function JobDetailPage() {
    const { baseUrl } = useData();
    const { jobId } = useParams();
    const { user, toggleSaveJob } = useAuth();
    const [job, setJob] = useState(null);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isComparing, setIsComparing] = useState(false);
    const [resumes, setResumes] = useState([]);
    const [currentResume, setCurrentResume] = useState(null);
    const [resumeScore, setResumeScore] = useState({
        skillSimilarity: 0,
        experienceSimilarity: 0,
        requirementsSimilarity: 0,
        totalScore: 0
    })
    const [userPreferences, setUserPreferences] = useState({

    })

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const response = await axios.get(`${baseUrl}/job-postings/${jobId}`)
                console.log('Job Posting: ', response.data.data)
                
                setJob(response.data.data)
            } catch (error) {
                console.error('Error: ', error)
            }
        }
        fetchJob()
    }, [jobId])

    useEffect(() => {
        const fetchCompany = async () => {
            if (!job?.company?._id) return; 

            try {
                const response = await axios.get(`${baseUrl}/companies/${job?.company?._id}`)
                console.log('Company: ', response.data.data)

                setCompany(response.data.data)
            } catch (error) {
                console.error('Error: ', error)
            }
        }
        fetchCompany()
    }, [job?.company?._id])

    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const response = await axios.get(`${baseUrl}/resumes/user/${user?._id}`)
                console.log('User Resumes: ', response.data.data)

                setResumes(response.data.data)
                if (response.data.data.length > 0) {
                    setCurrentResume(response.data.data[0]);
                }
            } catch (error) {
                console.error('Error: ', error)
            }
        }
        fetchResumes()
    }, [user?._id])

    useEffect(() => {
        if (job && company) {
            setLoading(false)
        }
    }, [job, company])

    useEffect(() => {
        const compareResumeAndJob = async () => {
            setIsComparing(true)
            try {
                const response = await axios.get(`${baseUrl}/ai/compare/${currentResume?._id}/${job?._id}`)

                console.log('Feedback: ', response.data)
                setResumeScore({
                    skillSimilarity: response.data.skill_similarity,
                    experienceSimilarity: response.data.experience_similarity,
                    requirementsSimilarity: response.data.requirements_similarity,
                    totalScore: response.data.total_score
                })
                
            } catch (error) {
                console.error('Error: ', error)
            } finally {
                setIsComparing(false)
            }
        }
        if (currentResume && job && !loading) {
            compareResumeAndJob();
        }
    }, [currentResume, job, loading])

    const handleAddSkillToResume = async (resumeId, newSkill) => {
        const currentResume = user.resumes.find(resume => resume._id === resumeId)
        if (!currentResume) return;

         // Check if skill is already in the resume
        const skillExists = currentResume.skills.some(s => s._id === newSkill._id)

        // Add or remove skill based on current status
        const updatedSkills = skillExists 
            ? currentResume.skills.filter(s => s._id !== newSkill._id)
            : [...currentResume.skills, newSkill]

        try {
            const response = await axios.patch(`${baseUrl}/resumes/${resumeId}`, {
                skills: updatedSkills
            })
            console.log(response.data.data.skills)
        } catch (error) {
            console.error('Failed to add skill:', error);
        }
    }

    const formatDate = (date) => {
        const postedDate = new Date(date);
        const now = new Date();
        const diffTime = Math.abs(now - postedDate);

        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 7 && diffDays !== 0) {
            return `Posted ${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
        } else if (diffDays === 0) {
            return 'Posted today'
        } else {
            return `Posted on ${postedDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })}`;   
        }
    }

    const getMatchedResumeSkills = (resume) => {
        if (!job || !job.skills) return []; // safety check
        
        const jobSkillNames = job.skills.map(skill => skill.name);
        const resumeSkills = resume.skills;
      
        const matchedSkills = resumeSkills.filter(skill => jobSkillNames.includes(skill.name)).map(skill => skill.name);

        const firstFour = matchedSkills.slice(0, 4).join(", ");
        const remainingCount = matchedSkills.length - 4;

        const displayText = remainingCount > 0 ? `${firstFour}, +${remainingCount}` : firstFour

        return displayText
    };      
      
    useEffect(() => {
        if (job && company) {
            document.title = `${job.title} - ${company.name}`
        }
    }, [job, company])

    const messages = {
        0: {
          rating: "No Resume yet",
          message: "You haven't uploaded a resume for this job. Consider adding one to improve your chances.",
        },
        0.25: {
          rating: "Poor",
          message: "Your resume has very few matching skills for this job. Try updating it with relevant skills.",
        },
        0.5: {
          rating: "Average",
          message: "Your resume matches some of the job's skills. A few tweaks could make it stronger.",
        },
        0.75: {
          rating: "Good",
          message: "Your resume aligns well with this job posting. A couple more relevant skills would make it great.",
        },
        0.9: {
          rating: "Great",
          message: "Your resume is a strong match for this job. You're just a step away from an excellent fit.",
        },
        1: {
          rating: "Excellent",
          message: "Your resume perfectly matches the job posting. You’re a top candidate for this role!",
        },
      };

    return (
        <>
            <Layout>
                <main id="job-details-page">

                    <section id="job-details">
                        <header>
                            {!loading ? (
                                <>
                                    {company.banner ? (
                                    <img 
                                        src={`/${company.banner}`} 
                                        className="company-banner-image" 
                                        alt={`${company.name} banner`}
                                    />
                                    ) : (
                                    <div className="banner"></div>
                                    )}
                                    
                                    <div className="icons">
                                    <img 
                                        src={`/${company.logo}`} 
                                        alt={`${company.name} logo`} 
                                        className="company-logo" 
                                    />
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
                                            <h2>${Number(job?.salary).toLocaleString()}<span>/year</span></h2>
                                        </div>
                                        <div className="row">
                                            <div>
                                                <h3>{company?.name}</h3>
                                                <h4>{company?.location}</h4>
                                            </div>
                                            <div className="actions">
                                                <button className="apply-btn">Apply Now</button>
                                                <button className="save-btn" onClick={(e) => toggleSaveJob(e, job._id)} aria-label="Save job">
                                                    <i className={`fa-${user?.savedJobs.includes(job?._id) ? 'solid' : 'regular'} fa-bookmark`}></i>
                                                </button>
                                                <button className="settings-btn">
                                                    <i className="fa-solid fa-gear"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="applicants">
                                            <img src="/media/pexels-alipli-15003448.jpg" alt="Applicant Image" />
                                            <img src="/media/pexels-anthonyshkraba-production-8278885.jpg" alt="Applicant Image" />
                                            <img src="/media/pexels-tima-miroshnichenko-6694958.jpg" alt="Applicant Image" />
                                            <span>3 Applicants</span>
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
                        <section className="job-highlights">
                            <ul>
                                {!loading ? (
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

                        <div className="wrapper">

                            <section id="job-description">

                                <div>
                                    <h3>Description</h3>
                                    {!loading ? (
                                        job.description ? (
                                            <p>{job.description}</p>
                                        ) : (
                                            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Perspiciatis facere laborum, impedit iusto fugit porro sequi sint vitae odio ut neque qui, esse mollitia. Corporis cumque veniam enim aliquid adipisci!</p>
                                        )
                                    ) : (
                                        <div className="skeleton-text-group">
                                            <div className="skeleton text max-width"></div>
                                            <div className="skeleton text max-width"></div>
                                            <div className="skeleton text short"></div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3>Requirements</h3>
                                    {!loading ? (
                                        <ul>
                                            {job.requirements.map((requirement, index) => (
                                                <li key={index}>{requirement}</li>
                                            ))}
                                    </ul>
                                    ) : (
                                        <div className="skeleton-text-group">
                                            <div className="skeleton text long"></div>
                                            <div className="skeleton text long"></div>
                                        </div>
                                    )}
                                </div>

                            </section>

                            <section id="skills">
                                
                                <div>
                                    <h3>Skills</h3>
                                    {!loading ? (
                                        <ul>
                                            {job.skills.map((skill, index) => (
                                                <li key={index}>
                                                    <div className="checkbox-wrapper-19">
                                                        <input 
                                                            type="checkbox" 
                                                            id={`cbtest-19 ${skill.name}`} 
                                                            checked={currentResume.skills.some(s => s.name === skill.name)}
                                                            onChange={() => handleAddSkillToResume(currentResume._id, skill)}
                                                        />
                                                        <label htmlFor={`cbtest-19 ${skill.name}`} className="check-box" />
                                                    </div>
                                                    <label htmlFor={`${skill.name}-checkbox`}>{skill.name} {skill.level}</label>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="skeleton-text-group">
                                            <div className="skeleton text long"></div>
                                            <div className="skeleton text long"></div>
                                            <div className="skeleton text long"></div>
                                        </div>
                                    )}
                                </div>
                                
                            </section>

                        </div>

                        <section id="about-the-company">
                            <h3>About the Company</h3>
                            <div className="wrapper">
                                <div id="company-details">
                                    {!loading ? (
                                        <p>{company?.description}</p>
                                    ) : (
                                        <div className="skeleton-text-group">
                                            <div className="skeleton text max-width"></div>
                                            <div className="skeleton text max-width"></div>
                                            <div className="skeleton text max-width"></div>
                                            <div className="skeleton text short"></div>
                                        </div>
                                    )}
                                    <div className="row">
                                        <div id="rating">
                                            {!loading ? (
                                                <img src={`/${company?.logo}`} alt={`${company?.name} logo`} />
                                            ) : (
                                                <div className="skeleton square"></div>
                                            )}
                                            <div style={{ marginTop: '8px' }}>
                                                <h4>{!loading ? company?.name : 'Company Name'}</h4>
                                                <span><i className="fa-solid fa-star"></i> {!loading ? company?.rating.toFixed(1) : '0.0'}</span>
                                            </div>
                                        </div>
                                        {company?.ceo && (
                                            <div id="ceo">
                                                {!loading ? (
                                                    company?.ceo.image ? (
                                                        <img src={`/${company?.ceo?.image}`} alt={`${company?.name} CEO`} />
                                                    ) : (
                                                        <i className="fa-solid fa-user"></i>
                                                    )
                                                ) : (
                                                    <div className="skeleton circle"></div>
                                                )}
                                                <div style={{ marginTop: '8px' }}>
                                                    {!loading && (
                                                        <h4>{company?.ceo?.name}</h4>
                                                    )}
                                                    <span>CEO</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {!loading ? (
                                    <div className="images">
                                        {company?.images.slice(0, 3).map((image, index) => (
                                            <img src={`/${image}`} key={index}></img>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="skeleton rectangle"></div>
                                )}
                            </div>
                        </section>

                    </section>

                    <section id="similarity-analysis">
                        {/* add gauge here later for similarity percentage */}
                        {/* add feature later here for resume selection */}
                        <section id="similarity-gauge">
                            <h3>Resume Analysis</h3>
                            <Gauge progress={resumeScore.totalScore} messages={messages} loading={isComparing} objectName={"Resume"}/>

                        </section>

                        <section id="resume-list">
                            <h3>Select Resume</h3>
                            <ol className="custom-ol">
                                {resumes.map((resume, index) => (
                                    <li className={`custom-li ${currentResume._id === resume._id ? 'current': ''}`} key={resume._id}>
                                        <div className="wrapper">
                                            <h4>Resume {index + 1}</h4> 
                                            <i className="fa-solid fa-angle-down" aria-label="Toggle content visibility"></i>
                                        </div>
                                        <span className="joined-skills">Matched skills: {getMatchedResumeSkills(resume)}</span>
                                    </li>
                                ))}
                            </ol>
                            <button className="upload-resume-btn">
                                <span>Or upload new resume</span>
                                <i className="fa-solid fa-arrow-up"></i>
                            </button>
                        </section>

                    </section>

                </main> 
            </Layout>
        </>
    )
}

export default JobDetailPage