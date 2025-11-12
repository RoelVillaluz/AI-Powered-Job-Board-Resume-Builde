import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from "react";
import { INDUSTRY_CHOICES } from "../../../backend/constants";
import { useData } from "./DataProvider";
import { useAuth } from "./AuthProvider";
import { useJobFilterLogic } from "../hooks/jobsList/useJobFilterLogic";
import axios from "axios";

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

    // Infinite job loading states
    const [additionalJobs, setAdditionalJobs] = useState([]);
    const [hasMoreJobs, setHasMoreJobs] = useState(true);
    const [isLoadingMoreJobs, setIsLoadingMoreJobs] = useState(false);

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

    // Combine all jobs (recommendations + additional loaded jobs)
    const allJobs = useMemo(() => {
        const recommended = jobRecommendations || []
        const additional = additionalJobs || []

        // Combine and ensure no duplicates from job recommendations and additional
        const combined = 
            [...recommended, 
            ...additional.filter(job => !recommended.some(rec => rec._id === job._id))
        ]

        return combined
    }, [jobRecommendations, additionalJobs])

    // Load more jobs for infinite scroll
    const loadMoreJobs = useCallback(async () => {
        if (isLoadingMoreJobs || !hasMoreJobs) return;

        setIsLoadingMoreJobs(true)

        try {
            const currentCount = (jobRecommendations?.length || 0) + additionalJobs.length;
            const response = await axios.get(`${baseUrl}/job-postings?skip=${allJobs.length}`);

            const newJobs = response.data.data;

            if (!newJobs || newJobs.length === 0) {
                setHasMoreJobs(false)
            } else {
                setAdditionalJobs(prev => [...prev, ...newJobs])
            }
        } catch (error) {
            console.error('Error loading more jobs:', error);
        } finally {
            setIsLoadingMoreJobs(false)
        }
    }, [baseUrl, allJobs.length, isLoadingMoreJobs, hasMoreJobs])

    // Initial load of additional jobs
    useEffect(() => {
        if (additionalJobs.length === 0 && !isLoadingMoreJobs) {
            loadMoreJobs();
        }
    }, []); 

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
        loadMoreJobs,
        isLoadingMoreJobs,
        hasMoreJobs
    }), [loading, allJobs, loadMoreJobs, isLoadingMoreJobs, hasMoreJobs])

    return (
        <JobFiltersContext.Provider value={JobFiltersValue}>
            <JobsStateContext.Provider value={JobStateValue}>
                {children}
            </JobsStateContext.Provider>
        </JobFiltersContext.Provider>
    )
}