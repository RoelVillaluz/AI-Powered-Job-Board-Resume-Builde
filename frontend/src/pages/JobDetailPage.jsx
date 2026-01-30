import { useState } from "react"
import Layout from "../components/Layout";
import { useParams } from "react-router-dom";
import ApplicationFormModal from "../components/JobDetailComponents/ApplicationFormModal";
import { useJobActions } from "../hooks/jobs/useJobActions";
import { useJobDetails } from "../hooks/jobs/useJobDetails";
import JobDetailHeader from "../components/JobDetailComponents/JobDetailHeader";
import JobHighlights from "../components/JobDetailComponents/JobHighlights";
import JobDescription from "../components/JobDetailComponents/JobDescription";
import JobSkillsSection from "../components/JobDetailComponents/JobSkillsSection";
import JobCompany from "../components/JobDetailComponents/JobCompany";
import JobSimilarityAnalysis from "../components/JobDetailComponents/JobSimilarityAnalysis";
import { useResumeStore } from "../stores/resumeStore"

function JobDetailPage() {
    const { jobId } = useParams();
    const { job } = useJobDetails(jobId);
    const currentResume = useResumeStore(state => state.currentResume);
    const { handleJobAction } = useJobActions();

    const hasQuestions = Boolean(job?.preScreeningQuestions?.length);

    const [showApplicationModal, setShowApplicationModal] = useState(false);

    const showModal = () => setShowApplicationModal(prev => !prev);

    return (
        <>
            <Layout>
                <main id="job-details-page">
                    <section id="job-details">
                        <JobDetailHeader
                            jobId={jobId}
                            showModal={showModal}
                        />
                        <JobHighlights jobId={jobId}/>
                        <div className="wrapper">
                            <JobDescription jobId={jobId}/>
                        </div>
                        <div className="wrapper">
                            <JobSkillsSection jobId={jobId}/>
                        </div>
                        <JobCompany jobId={jobId}/>
                    </section>
                    <JobSimilarityAnalysis jobId={jobId}/>
                </main> 
            </Layout>

            {showApplicationModal && hasQuestions && (
                <ApplicationFormModal 
                    job={job} 
                    onClose={showModal} 
                    onSubmit={(answers) => handleJobAction(
                        new Event("submit"),
                        job._id,
                        currentResume._id,
                        "apply",
                        hasQuestions,
                        showModal,
                        answers
                    )}
                />
            )}
        </>
    );
}

export default JobDetailPage;