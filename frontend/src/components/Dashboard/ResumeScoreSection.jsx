import Gauge from "../Gauge";
import { useResumeScore } from "../../hooks/resumes/useResumeScore";

function ResumeScoreSection() {
    const { score, jobProgress, secondsRemaining, loading, messages, isQueued } = useResumeScore();

    return (
        <section className="grid-item" id="resume-score">
            <header>
                <h4>Resume Score</h4>
            </header>

            <Gauge
                value={score}
                jobProgress={jobProgress}
                secondsRemaining={secondsRemaining}
                messages={messages}
                loading={loading}
                isAnalyzing={isQueued}
                objectName="Resume"
            />
        </section>
    );
}

export default ResumeScoreSection;