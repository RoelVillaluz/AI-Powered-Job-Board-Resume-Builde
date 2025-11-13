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
    const { baseUrl, fetchResumes, jobRecommendations, fetchJobRecommendations, resumes } = useData();

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
        if (isLoadingMoreJobs) return;

        setIsLoadingMoreJobs(true)

        try {
            const skipCount = additionalJobs.length;
            
            // Get IDs of jobs already recommended
            const excludeIds = (jobRecommendations || []).map(job => job._id).join(',');
            
            console.log('=== LOAD MORE DEBUG ===');
            console.log('Skip count:', skipCount);
            console.log('Job recommendations count:', jobRecommendations?.length || 0);
            console.log('Exclude IDs:', excludeIds);
            console.log('Additional jobs so far:', additionalJobs.length);
            
            const response = await axios.get(
                `${baseUrl}/job-postings?skip=${skipCount}&exclude=${excludeIds}`
            );

            console.log('Full response:', response.data);
            console.log('=== END DEBUG ===');

            const newJobs = response.data.data;
            const hasMore = response.data.hasMore;

            if (!newJobs || newJobs.length === 0) {
                setHasMoreJobs(false)
                console.log('No more jobs to load');
            } else {
                setAdditionalJobs(prev => [...prev, ...newJobs]);
                setHasMoreJobs(hasMore);
                console.log('Updated additional jobs total:', additionalJobs.length + newJobs.length);
            }
        } catch (error) {
            console.error('Error loading more jobs:', error);
        } finally {
            setIsLoadingMoreJobs(false)
        }
    }, [baseUrl, additionalJobs.length, isLoadingMoreJobs, jobRecommendations])

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