import { useAuthStore } from "../../stores/authStore";
import { useResumeStore } from "../../stores/resumeStore";
import { useUserResumesQuery } from "../../hooks/resumes/useResumeQueries";
import { useResumeAnalysis } from "../../hooks/resumes/useResumeAnalysis";
import Gauge from "../Gauge";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useJobDetails } from "../../hooks/jobs/useJobDetails";

const EMPTY_STATE_MESSAGE = 'No resumes found, try creating one first.'

const LoadingSkeleton = () => {
    return (
        <ol className="custom-ol" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
            {[1, 2, 3].map((i) => (
                <li key={i} className="skeleton text max-width"></li>
            ))}
        </ol>
    )
}

const ResumeList = ({ job }) => {
    const user = useAuthStore(state => state.user);
    const { data: resumes = [], isLoading, error } = useUserResumesQuery(user?._id);
    const currentResume = useResumeStore(state => state.currentResume);
    const setCurrentResume = useResumeStore(state => state.setCurrentResume);

    const jobSkillsLowercase = useMemo(() =>
        job?.skills?.map(s => s.name.toLowerCase()) || [],
        [job?._id]
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
                <h3>{isLoading ? 'Loading Resumes' : 'Select Resumes'}</h3>
                {isLoading && (
                    <div className="circle-spinner" aria-label="Loading"></div>
                )}
            </div>
            {isLoading ? (
                <LoadingSkeleton/>
            ) : (
                <ol className="custom-ol">
                    {resumes.length > 0 ? (
                        resumes.map((resume, index) => (
                            <li
                                className={`custom-li ${currentResume?._id === resume._id ? 'current': ''}`}
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
            )}
            <Link to={`/resumes/${user._id}/create`} className="create-resume-link">
                <span>Or create new resume</span>
                <i className="fa-solid fa-arrow-up"></i>
            </Link>
        </section>
    )
}

// Small helper component — splits off the opening verdict sentence as a
// lede so the eye has an entry point instead of one dense block. Safe
// against decimals/dollar figures ("$170,000", "43.36/100") since it only
// splits on ". " (period + space), not on bare periods.
function AiSummaryText({ text }) {
    const splitIndex = text.indexOf('. ');
    const hasLede = splitIndex > -1 && splitIndex < text.length - 2;

    const lede = hasLede ? text.slice(0, splitIndex + 1) : text;
    const rest = hasLede ? text.slice(splitIndex + 2) : '';

    return (
        <div className="ai-summary-text">
            <p className="ai-summary-lede">{lede}</p>
            {rest && <p className="ai-summary-body">{rest}</p>}
        </div>
    );
}

function JobSimilarityAnalysis({ jobId }) {
    const { job, isLoading } = useJobDetails(jobId);
    const { resumeScore, isComparing, messages, strengths, improvements, explanation, isGeneratingExplanation, error } =
        useResumeAnalysis(jobId);

    return (
        <section id="similarity-analysis">
            <section id="similarity-gauge">
                <h3>Resume Analysis</h3>
                <Gauge value={resumeScore?.totalScore} messages={messages} loading={isComparing} objectName={"Resume"} displayName="Overall Fit"/>

                {strengths && !isComparing && (
                    <div className="feedback-messages-container" style={{ paddingTop: '1rem', borderTop: 'solid 1px #dedfe0'}}>
                        <div className="wrapper">
                            <i className="fa-solid fa-circle-check"></i>
                            <h4>Strengths</h4>
                        </div>
                        <ul>
                            {strengths.map((strength, index) => (
                                <li key={index}>
                                    <i className="fa-solid fa-check"></i>
                                    {strength}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {improvements && !isComparing && (
                    <div className="feedback-messages-container">
                        <div className="wrapper">
                            <i className="fa-solid fa-circle-exclamation"></i>
                            <h4>Areas for Improvement</h4>
                        </div>
                        <ul>
                            {improvements.map((improvement, index) => (
                                <li key={index}>
                                    <i className="fa-solid fa-exclamation"></i>
                                    {improvement}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {!isComparing && (
                    <div className="feedback-messages-container ai-summary-container">
                        <div className="wrapper">
                            <i className="fa-solid fa-wand-magic-sparkles"></i>
                            <h4>AI Summary</h4>
                        </div>

                        {explanation ? (
                            <AiSummaryText text={explanation} />
                        ) : isGeneratingExplanation ? (
                            <div className="ai-summary-loading">
                                <div className="circle-spinner" aria-label="Generating summary"></div>
                                <span className="empty-state">Generating your personalized summary...</span>
                            </div>
                        ) : (
                            <span className="empty-state">Summary unavailable.</span>
                        )}
                    </div>
                )}

                {error && (
                    <h2>Error: {typeof error === 'string' ? error : error?.message ?? 'Something went wrong'}</h2>
                )}

            </section>

            <ResumeList job={job}/>
        </section>
    )
}

export default JobSimilarityAnalysis