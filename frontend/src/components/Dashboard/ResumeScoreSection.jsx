import Gauge from "../Gauge";
import { useResumeScore } from "../../hooks/resumes/useResumeScore";

function ResumeScoreSection() {
  const { score, jobProgress, loading, messages, isQueued } = useResumeScore();

  return (
    <section className="grid-item" id="resume-score">
      <header>
        <h4>Resume Score</h4>
      </header>

      <Gauge
        value={score}           // actual score (null while calculating)
        jobProgress={jobProgress} // 0-100 job progress
        messages={messages}
        loading={loading}
        isAnalyzing={isQueued}  // drives the visual style
        objectName="Resume"
      />
    </section>
  );
}

export default ResumeScoreSection;
