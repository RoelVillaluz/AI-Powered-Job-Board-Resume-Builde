import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from "react";
import { INDUSTRY_CHOICES } from "../../../backend/constants";
import { useData } from "./DataProvider";
import { useAuth } from "./AuthProvider";
import { useJobFilterLogic } from "../hooks/jobsList/useJobFilterLogic";

const JobFiltersContext = createContext();
const JobsStateContext = createContext();

export const useJobFilters = () => {
    const context = useContext(JobFiltersContext)
    if (!context) {
        throw new Error('useJobFilters must be used within a JobsListProvider');
    }
    return context;
}

export const useJobsState = () => {
    const context = useContext(JobsStateContext)
    if (!context) {
        throw new Error('useJobsState must be used within a JobsListProvider');
    }
    return context
}

export const JobsListProvider = ({ children }) => {
    const { user } = useAuth();
    const { baseUrl, getAllData, fetchResumes, jobRecommendations, jobPostings, fetchJobRecommendations, resumes } = useData();

    const [loading, setLoading] = useState(true)
    const [allResumeSkills, setAllResumeSkills] = useState([]);

    const combineResumeSkills = useCallback(() => {
        if (!Array.isArray(resumes)) return;

        const resumeSkills = resumes
            .flatMap((resume) => Array.isArray(resume.skills)
            ? resume.skills.map((skill) => skill.name)
            : []
            );

        const uniqueSkills = [...new Set(resumeSkills)];
        setAllResumeSkills(uniqueSkills);
    }, [resumes]);

    useEffect(() => {
        if (user?._id) {
            fetchResumes(user._id);
        }
    }, [user]);

    useEffect(() => {        
        if (resumes.length > 0 ) fetchJobRecommendations()
    }, [resumes])

    useEffect(() => {
        getAllData(["job-postings"]);
    }, [])

    // Combine resume skills when resumes change
    useEffect(() => {
        combineResumeSkills();
    }, [combineResumeSkills]);

    // Combine all jobs
    const allJobs = [
        ...jobRecommendations,
        ...jobPostings.filter(job => 
            !jobRecommendations.some(rec => rec._id === job._id) // filter jobs that are already present in jobRecommendations
        )
    ]

    // Use the extracted hook for filter logic
    const jobFiltersLogic = useJobFilterLogic(allResumeSkills, allJobs, user)

    // Context values
    const JobFiltersValue = useMemo(() => ({
        ...jobFiltersLogic,
        allResumeSkills, // Include allResumeSkills in the context
        resumes // Also include resumes if needed
    }), [jobFiltersLogic, allResumeSkills, resumes])

    const JobStateValue = useMemo(() => ({
        loading,
        setLoading,
        allJobs,
    }), [loading, allJobs])

    return (
        <JobFiltersContext.Provider value={JobFiltersValue}>
            <JobsStateContext.Provider value={JobStateValue}>
                {children}
            </JobsStateContext.Provider>
        </JobFiltersContext.Provider>
    )
}