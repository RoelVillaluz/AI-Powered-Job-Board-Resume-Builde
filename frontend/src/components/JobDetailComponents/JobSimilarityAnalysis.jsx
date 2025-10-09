import { useAuth } from "../../contexts/AuthProvider";
import { useResume } from "../../contexts/ResumesContext";
import { useResumeAnalysis } from "../../hooks/resumes/useResumeAnalysis";
import Gauge from "../Gauge";
import { useMemo } from "react";
import { Link } from "react-router-dom";

const ResumeList = ({ job, resumes, currentResume, setCurrentResume }) => {
    const { user } = useAuth()

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
            <h3>Select Resume</h3>
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
                )}
            </ol>
            <Link to={`/resumes/${user._id}/create`} className="create-resume-link">
                <span>Or create new resume</span>
                <i className="fa-solid fa-arrow-up"></i>
            </Link>
        </section>
    )
}

function JobSimilarityAnalysis({ job }) {
    const { resumes, currentResume, setCurrentResume } = useResume();
    const { resumeScore, isComparing, messages, error } = useResumeAnalysis();

    return (
        <section id="similarity-analysis">
            {/* add feature later here for resume selection */}
            <section id="similarity-gauge">
                <h3>Resume Analysis</h3>
                <Gauge progress={resumeScore.totalScore} messages={messages} loading={isComparing} objectName={"Resume"}/>
                
                <div>
                    <h6>Change Resume scorer later to make this have dynamic feedback</h6>
                    <p>Strengths: High skill similarity</p>
                    <p>Weaknesses: Low relevant work experience. No college degree yet.</p>
                </div>

                <h2>Error: {error}</h2>
                
            </section>

            {/* fix prop drilling here later, since the props arent getting used just passed, maybe move down directly to the component */}
            <ResumeList job={job} resumes={resumes} currentResume={currentResume} setCurrentResume={setCurrentResume}/>
        </section>
    )
}

export default JobSimilarityAnalysis