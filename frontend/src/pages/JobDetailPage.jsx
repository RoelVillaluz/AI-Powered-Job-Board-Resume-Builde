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
import JobDescription from "../components/JobDetailComponents/JobDescription";
import JobSkillsSection from "../components/JobDetailComponents/JobSkillsSection";
import JobCompany from "../components/JobDetailComponents/JobCompany";
import JobSimilarityAnalysis from "../components/JobDetailComponents/JobSimilarityAnalysis";

function JobDetailPage() {
    const { baseUrl } = useData();
    const { jobId } = useParams();
    const { user } = useAuth();
    const { job, company, loading, hasQuestions } = useJobDetails(baseUrl, jobId);
    const { currentResume } = useResume();
    const { resumeScore } = useResumeAnalysis();
    const { handleJobAction } = useJobActions();

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

                        {/* move props later directly into component since data is mutated */}
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

                        <div className="wrapper">
                            <JobDescription job={job} loading={loading}/>
                        </div>

                        {/* import statements directly since data is mutated in this specific components */}
                        <div className="wrapper">
                            <JobSkillsSection
                                job={job} 
                                loading={loading}
                            />
                        </div>

                        {/* use props since data is only being shown in this component and is for read only/ display */}
                        <JobCompany
                            company={company}
                            loading={loading}
                        />

                    </section>
                    <JobSimilarityAnalysis
                        job={job}
                        loading={loading}
                    />

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