import { useAuth } from "../../contexts/AuthProvider";
import { useResume } from "../../contexts/ResumesContext";
import { useResumeAnalysis } from "../../hooks/resumes/useResumeAnalysis";
import Gauge from "../Gauge";
import { useMemo } from "react";
import { Link } from "react-router-dom";

const EMPTY_STATE_MESSAGE = 'No resumes found, try creating one first.'

const LoadingSkeleton = () => {
    return (
        <ol className="custom-ol" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
            {[1, 2, 3].map((i) => (
                <li className="skeleton text max-width"></li>
            ))}
        </ol>
    )
}

const ResumeList = ({ job }) => {
    const { user } = useAuth()
    const { resumes, currentResume, setCurrentResume, loading } = useResume();

    const jobSkillsLowercase = useMemo(() => 
        job?.skills?.map(s => s.name.toLowerCase()) || [],
        [job?.skills]

    )

    const getMatchedResumeSkills = (resume) => {
        if (!jobSkillsLowercase.length || !resume?.skills) return '';

        const matched = resume.skills.filter(skill => 
            jobSkillsLowercase.includes(skill.name.toLowerCase())
        )

        return matched.length > 0 
        ? matched.map(s => s.name).join(', ') 
        : 'No matching skills';
    }

    return (
        <section id="resume-list">
            <div className="wrapper" style={{ alignItems: 'center', gap: '0.75rem' }}>
                <h3>{loading ? 'Select Resume' : 'Loading Resumes'}</h3>
                {!loading && (
                    <div className="circle-spinner" aria-label="Loading"></div>
                )}
            </div>
            {loading ? (
                <ol className="custom-ol">
                    {resumes.length > 0 && (
                        resumes.map((resume, index) => (
                            <li 
                                className={`custom-li ${currentResume._id === resume._id ? 'current': ''}`} 
                                key={resume._id}
                                onClick={() => setCurrentResume(resume)}
                            >
                                <div className="wrapper">
                                    <h4>Resume {index + 1}</h4> 
                                    <i className="fa-solid fa-angle-down" aria-label="Toggle content visibility"></i>
                                </div>
                                <span className="joined-skills">Matched skills: {getMatchedResumeSkills(resume)}</span>
                            </li>
                        ))
                    ) : (
                        <span>{EMPTY_STATE_MESSAGE}</span>
                    )}
                </ol>
            ) : (
                <LoadingSkeleton/>
            )}
            <Link to={`/resumes/${user._id}/create`} className="create-resume-link">
                <span>Or create new resume</span>
                <i className="fa-solid fa-arrow-up"></i>
            </Link>
        </section>
    )
}

function JobSimilarityAnalysis({ job }) {
    const { resumeScore, isComparing, messages, error } = useResumeAnalysis();

    return (
        <section id="similarity-analysis">
            {/* add feature later here for resume selection */}
            <section id="similarity-gauge">
                <h3>Resume Analysis</h3>
                <Gauge progress={resumeScore.totalScore} messages={messages} loading={isComparing} objectName={"Resume"}/>
                
                {/* <div>
                    <h6>Change Resume scorer later to make this have dynamic feedback</h6>
                    <p>Strengths: High skill similarity</p>
                    <p>Weaknesses: Low relevant work experience. No college degree yet.</p>
                </div>

                <h2>Error: {error}</h2> */}
                
            </section>

            <ResumeList job={job}/>
        </section>
    )
}

export default JobSimilarityAnalysis