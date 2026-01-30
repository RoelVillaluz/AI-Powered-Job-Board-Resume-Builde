import { useEffect, useState, useRef, useCallback } from "react";
import Layout from "../components/Layout";
import FilterSidebar from "../components/JobListComponents/FilterSidebar";
import JobPostingsListSection from "../components/JobListComponents/JobPostingsListSection";
import JobSearchBar from "../components/JobListComponents/JobSearchBar";
import ApplicationFormModal from "../components/JobDetailComponents/ApplicationFormModal";
import { useAuthStore } from "../stores/authStore";
import { useResumeStore } from "../stores/resumeStore";
import { useJobStore } from "../stores/jobStore";
import { useUserResumesQuery } from "../hooks/resumes/useResumeQueries";

function JobPostingsList() {
    const user = useAuthStore(state => state.user);
    const { data: resumes, isLoading: resumesLoading } = useUserResumesQuery(user?._id);
    const currentResume = useResumeStore(state => state.resume);

    const [selectedJob, setSelectedJob] = useState(null);
    const [hasQuestions, setHasQuestions] = useState(false);
    const [showApplicationModal, setShowApplicationModal] = useState(false);
    const lastEventRef = useRef(null);
    const [preScreeningAnswers, setPreScreeningAnswers] = useState(null);

    useEffect(() => {
        document.title = 'All Jobs';
    }, []);

    const showModal = useCallback((job, hasQuestions, event = null) => {
        if (event) lastEventRef.current = event;
        setSelectedJob(job);
        setHasQuestions(hasQuestions);
        setShowApplicationModal(true);
    }, []);

    const handleJobAction = useCallback(async (
        event,
        jobId,
        resumeId,
        action,
        hasQuestions,
        preScreeningAnswers,
        isApplied
    ) => {
        // Your job action logic here (apply, save, etc.)
        console.log('Job action:', { jobId, resumeId, action, preScreeningAnswers });
    }, []);

    useEffect(() => {
        if (preScreeningAnswers) {
            handleJobAction(
                lastEventRef.current || new Event('submit'),
                selectedJob._id,
                currentResume._id,
                'apply',
                hasQuestions,
                preScreeningAnswers,
                false
            );
            setPreScreeningAnswers(null);
            setShowApplicationModal(false);
        }
    }, [preScreeningAnswers, selectedJob, currentResume, hasQuestions, handleJobAction]);

    return (
        <>
            <Layout>
                <div className="container" style={{ alignItems: 'start' }}>
                    <FilterSidebar/>

                    <main id="job-list-container">
                        <JobSearchBar />
                        {/* <TopCompanies baseUrl={baseUrl} user={user} /> */}

                        <JobPostingsListSection onShowModal={showModal} />
                    </main>
                </div>
            </Layout>

            {showApplicationModal && hasQuestions && (
                <ApplicationFormModal 
                    job={selectedJob} 
                    onClose={() => setShowApplicationModal(false)} 
                    onSubmit={(answers) => setPreScreeningAnswers(answers)} 
                />
            )}
        </>
    );
}

export default JobPostingsList;