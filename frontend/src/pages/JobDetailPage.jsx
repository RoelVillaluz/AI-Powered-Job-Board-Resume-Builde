import { useEffect, useState } from "react"
import Layout from "../components/Layout";
import axios from "axios";
import { useData } from "../contexts/DataProvider";
import { useParams } from "react-router-dom";
import { faL } from "@fortawesome/free-solid-svg-icons";
import Resume from "../../../backend/models/resumeModel";
import { useAuth } from "../contexts/AuthProvider";
import Gauge from "../components/Gauge";
import ApplicationFormModal from "../components/JobDetailComponents/ApplicationFormModal";
import { useJobActions } from "../hooks/jobs/useJobActions";
import { useJobDetails } from "../hooks/jobs/useJobDetails";
import { useResumeAnalysis } from "../hooks/resumes/useResumeAnalysis";
import JobDetailHeader from "../components/JobDetailComponents/JobDetailHeader";
import { useResume } from "../contexts/ResumesContext";
import JobHighlights from "../components/JobDetailComponents/JobHighlights";

function JobDetailPage() {
    const { baseUrl } = useData();
    const { jobId } = useParams();
    const { user, setUser  } = useAuth();
    const { job, company, loading, hasQuestions } = useJobDetails(baseUrl, jobId);
    const { currentResume } = useResume();
    const { resumeScore } = useResumeAnalysis();
    const { toggleSaveJob, toggleApplyJob, handleJobAction } = useJobActions();

    const [showApplicationModal, setShowApplicationModal] = useState(false);

    const showModal = () => {
        setShowApplicationModal(prev => !prev)
    }
      
    useEffect(() => {
        if (job && company) {
            document.title = `${job.title} - ${company.name}`
        }
    }, [job, company])

    return (
        <>
            <Layout>
                <main id="job-details-page">

                    <section id="job-details">
                        <JobDetailHeader
                            user={user}
                            job={job}
                            company={company}
                            currentResume={currentResume}
                            loading={loading}
                            hasQuestions={hasQuestions}
                            showModal={showModal}
                        />
                        <JobHighlights job={job} company={company} loading={loading}/>
                        {/* 
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
                                                            checked={currentResume?.skills.some(s => s.name === skill.name)}
                                                            onChange={() => handleAddSkillToResume(currentResume?._id, skill)}
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
                        {/* <section id="similarity-gauge">
                            <h3>Resume Analysis</h3>
                            <Gauge progress={resumeScore.totalScore} messages={messages} loading={isComparing} objectName={"Resume"}/>
                            
                            <div>
                                <h6>Change Resume scorer later to make this have dynamic feedback</h6>
                                <p>Strengths: High skill similarity</p>
                                <p>Weaknesses: Low relevant work experience. No college degree yet.</p>
                            </div>
                            
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
                        </section>  */}

                    </section>

                </main> 
            </Layout>
            {showApplicationModal && hasQuestions && (
                <ApplicationFormModal 
                    job={job} 
                    onClose={() => showModal()} 
                    onSubmit={(answers) => handleJobAction(
                        new Event("submit"),
                        job._id,
                        currentResume._id,
                        "apply", // actionType
                        hasQuestions,
                        showModal, 
                        answers // answers from modal
                    )}
                />
            )}
        </>
    )
}

export default JobDetailPage