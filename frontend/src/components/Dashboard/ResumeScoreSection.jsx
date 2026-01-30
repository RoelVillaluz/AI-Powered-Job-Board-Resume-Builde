import Gauge from "../Gauge";
import { useResumeScore } from "../../hooks/resumes/useResumeScore";

function ResumeScoreSection() {
  const { progress, loading, messages } = useResumeScore();

  return (
    <section className="grid-item" id="resume-score">
      <header>
        <h4>Resume Score</h4>
      </header>

      <Gauge
        progress={progress}
        messages={messages}
        loading={loading}
        objectName="Resume"
      />
    </section>
  );
}

export default ResumeScoreSection;
