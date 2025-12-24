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
    const {
        baseUrl,
        fetchResumes,
        jobRecommendations,
        fetchJobRecommendations,
        resumes
    } = useData();

    const [loading, setLoading] = useState(true);
    const [allResumeSkills, setAllResumeSkills] = useState([]);

    // Infinite scroll states (cursor-based)
    const [additionalJobs, setAdditionalJobs] = useState([]);
    const [hasMoreJobs, setHasMoreJobs] = useState(true);
    const [isLoadingMoreJobs, setIsLoadingMoreJobs] = useState(false);
    const [cursor, setCursor] = useState(null);

    // Combine resume skills
    useEffect(() => {
        if (!Array.isArray(resumes)) return;

        const skills = resumes
            .flatMap(resume =>
                Array.isArray(resume.skills)
                    ? resume.skills.map(skill => skill.name)
                    : []
            );

        setAllResumeSkills([...new Set(skills)]);
    }, [resumes]);

    useEffect(() => {
        if (user?._id) {
            fetchResumes(user._id);
        }
    }, [user]);

    useEffect(() => {
        if (resumes.length > 0) {
            fetchJobRecommendations();
        }
    }, [resumes]);

    // Combine recommended + additional jobs (no duplicates)
    const allJobs = useMemo(() => {
        const recommended = jobRecommendations || [];
        const additional = additionalJobs || [];

        return [
            ...recommended,
            ...additional.filter(
                job => !recommended.some(rec => rec._id === job._id)
            )
        ];
    }, [jobRecommendations, additionalJobs]);

    // Cursor-based infinite loader
    const loadMoreJobs = useCallback(async () => {
        if (isLoadingMoreJobs || !hasMoreJobs) return;

        setIsLoadingMoreJobs(true);

        try {
            const excludeIds = (jobRecommendations || [])
                .map(job => job._id)
                .join(",");

            const response = await axios.get(
                `${baseUrl}/job-postings`,
                {
                    params: {
                        cursor,
                        exclude: excludeIds
                    }
                }
            );

            const {
                jobPostings,
                hasMore,
                nextCursor
            } = response.data.data;

            if (!jobPostings || jobPostings.length === 0) {
                setHasMoreJobs(false);
            } else {
                setAdditionalJobs(prev => [...prev, ...jobPostings]);
                setHasMoreJobs(hasMore);
                setCursor(nextCursor);
            }
        } catch (error) {
            console.error("Error loading more jobs:", error);
        } finally {
            setIsLoadingMoreJobs(false);
        }
    }, [
        baseUrl,
        cursor,
        hasMoreJobs,
        isLoadingMoreJobs,
        jobRecommendations
    ]);

    // Filters logic
    const jobFiltersLogic = useJobFilterLogic(
        allResumeSkills,
        allJobs,
        user
    );

    const JobFiltersValue = useMemo(
        () => ({
            ...jobFiltersLogic,
            allResumeSkills,
            resumes
        }),
        [jobFiltersLogic, allResumeSkills, resumes]
    );

    const JobStateValue = useMemo(
        () => ({
            loading,
            setLoading,
            allJobs,
            loadMoreJobs,
            isLoadingMoreJobs,
            hasMoreJobs
        }),
        [loading, allJobs, loadMoreJobs, isLoadingMoreJobs, hasMoreJobs]
    );

    return (
        <JobFiltersContext.Provider value={JobFiltersValue}>
            <JobsStateContext.Provider value={JobStateValue}>
                {children}
            </JobsStateContext.Provider>
        </JobFiltersContext.Provider>
    );
};