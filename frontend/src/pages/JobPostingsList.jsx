import { useEffect, useState, useRef, useMemo } from "react"
import { useAuth } from "../contexts/AuthProvider"
import { useData } from "../contexts/DataProvider";
import axios, { all } from "axios";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";
import JobPostingCard from "../components/JobListComponents/JobPostingCard";
import FilterSidebar from "../components/FilterSidebar";
import JobSearchBar from "../components/JobListComponents/JobSearchBar";
import { useJobFilters, useJobsState } from "../contexts/JobsListContext";
import TopCompanies from "../components/JobListComponents/TopCompanies";
import JobPostingsListSection from "../components/JobListComponents/JobPostingsListSection";
import ApplicationFormModal from "../components/JobDetailComponents/ApplicationFormModal";

function JobPostingsList() {
    const { user, handleJobAction } = useAuth();
    const { baseUrl } = useData();
    const { filterRef, resumes } = useJobFilters();
    const [selectedJob, setSelectedJob] = useState(null)
    const [hasQuestions, setHasQuestions] = useState(false);
    const [showApplicationModal, setShowApplicationModal] = useState(false);
    const [currentResume, setCurrentResume] = useState(null);
    const lastEventRef = useRef(null);
    const [preScreeningAnswers, setPreScreeningAnswers] = useState(null);


    useEffect(() => {
        document.title = 'All Jobs'
    }, [])

    // Toggle application modal visibility
    const showModal = (job, hasQuestions, event = null) => {
        if (event) lastEventRef.current = event;
        setSelectedJob(job);
        setHasQuestions(hasQuestions);
        setShowApplicationModal(true);
    };

    useEffect(() => {
        if (resumes.length === 0) return;

        setCurrentResume(resumes[0])
    }, [resumes])

    useEffect(() => {
        if (preScreeningAnswers) {
            // Call apply after modal submission
            handleJobAction(
                lastEventRef.current || new Event('submit'),  // Use last stored click event
                selectedJob._id,
                currentResume._id,
                'apply',
                hasQuestions,
                preScreeningAnswers,
                false // isApplied
            );
            setPreScreeningAnswers(null);  // Reset after submission
            setShowApplicationModal(false); // Close modal
        }
    }, [preScreeningAnswers]);


    return (
        <>
            <Layout>
                <div className="container" style={{ alignItems: 'start' }}>

                    <FilterSidebar ref={filterRef} />

                    <main id="job-list-container">

                        <JobSearchBar
                            filterRef={filterRef}
                        />  

                        <TopCompanies
                            baseUrl={baseUrl}
                            user={user}
                        />

                        <JobPostingsListSection
                            currentResume={currentResume}
                            onShowModal={showModal}
                        />

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
    )
}

export default JobPostingsList