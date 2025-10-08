import { useResume } from "../../contexts/ResumesContext";
import { useResumeAnalysis } from "../../hooks/resumes/useResumeAnalysis";
import Gauge from "../Gauge";

const ResumeList = ({ job, resumes, currentResume, setCurrentResume }) => {
    const getMatchedResumeSkills = (resume) => {
        if (!job?.skills || !resume?.skills) return '';

        const jobSkills = job.skills.map(s => s.name.toLowerCase())
        const matched = resume.skills.filter(skill => jobSkills.includes(skill.name.toLowerCase()))

        return matched.length > 0 
        ? matched.map(s => s.name).join(', ') 
        : 'No matching skills';
    }

    return (
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
    )
}

function JobSimilarityAnalysis({ job, loading }) {
    const { resumes, currentResume, setCurrentResume } = useResume();
    const { resumeScore, isComparing, messages } = useResumeAnalysis();

    return (
        <section id="similarity-analysis">
            {/* add gauge here later for similarity percentage */}
            {/* add feature later here for resume selection */}
            <section id="similarity-gauge">
                <h3>Resume Analysis</h3>
                <Gauge progress={resumeScore.totalScore} messages={messages} loading={isComparing} objectName={"Resume"}/>
                
                <div>
                    <h6>Change Resume scorer later to make this have dynamic feedback</h6>
                    <p>Strengths: High skill similarity</p>
                    <p>Weaknesses: Low relevant work experience. No college degree yet.</p>
                </div>
                
            </section>

            <ResumeList job={job} resumes={resumes} currentResume={currentResume} setCurrentResume={setCurrentResume}/>
        </section>
    )
}

export default JobSimilarityAnalysis