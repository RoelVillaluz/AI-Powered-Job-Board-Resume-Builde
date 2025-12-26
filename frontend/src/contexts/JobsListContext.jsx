import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { useData } from "./DataProvider";
import { useAuth } from "./AuthProvider";
import { useJobFilterLogic } from "../hooks/jobsList/useJobFilterLogic";
import { useJobSorting } from "../hooks/jobsList/useJobSorting";
import { useJobInfiniteScroll } from "../hooks/jobsList/useJobInfiniteScroll";
import { useClientSideFilters } from "../hooks/jobsList/useClientSideFilters";
import { useResumeSkills } from "../hooks/resumes/useResumeSkills";

const JobFiltersContext = createContext();
const JobsStateContext = createContext();

export const useJobFilters = () => {
    const context = useContext(JobFiltersContext);
    if (!context) {
        throw new Error('useJobFilters must be used within a JobsListProvider');
    }
    return context;
};

export const useJobsState = () => {
    const context = useContext(JobsStateContext);
    if (!context) {
        throw new Error('useJobsState must be used within a JobsListProvider');
    }
    return context;
};

export const JobsListProvider = ({ children }) => {
    const { user } = useAuth();
    const { 
        baseUrl, 
        fetchResumes, 
        resumes,
        jobRecommendations,
        fetchJobRecommendations
    } = useData();

    // Track if we've already fetched to prevent duplicate calls
    const hasFetchedResumes = useRef(false);
    const hasFetchedRecommendations = useRef(false);

    // Extract resume skills
    const allResumeSkills = useResumeSkills(resumes);

    // Fetch resumes on mount (once)
    useEffect(() => {
        if (user?._id && !hasFetchedResumes.current) {
            hasFetchedResumes.current = true;
            fetchResumes(user._id);
        }
    }, [user?._id]); // Remove fetchResumes from dependencies

    // Fetch job recommendations when resumes are loaded (once)
    useEffect(() => {
        if (resumes.length > 0 && !hasFetchedRecommendations.current) {
            hasFetchedRecommendations.current = true;
            fetchJobRecommendations();
        }
    }, [resumes.length]); // Remove fetchJobRecommendations from dependencies

    // Filter logic
    const filterLogic = useJobFilterLogic(allResumeSkills);
    const { filters } = filterLogic;

    // Sorting logic
    const sortingLogic = useJobSorting();
    const { sortBy } = sortingLogic;

    // API calls and job fetching (pass jobRecommendations from useData)
    const infiniteScrolledJob = useJobInfiniteScroll(baseUrl, filters, sortBy, jobRecommendations);
    const { fetchJobs } = infiniteScrolledJob;

    // Fetch jobs when filters, sort, or recommended jobs change
    useEffect(() => {
        if (resumes.length > 0 && jobRecommendations.length >= 0) {
            fetchJobs(true);
        }
    }, [filters, sortBy, jobRecommendations.length, resumes.length]);

    // Client-side filtering (for match score and application status)
    const filteredJobs = useClientSideFilters(infiniteScrolledJob.jobs, filters, user);

    const JobFiltersValue = useMemo(
        () => ({
            ...filterLogic,
            ...sortingLogic,
            allResumeSkills,
            resumes
        }),
        [filterLogic, sortingLogic, allResumeSkills, resumes]
    );

    const JobStateValue = useMemo(
        () => ({
            ...infiniteScrolledJob,
            jobs: filteredJobs
        }),
        [infiniteScrolledJob, filteredJobs]
    );

    return (
        <JobFiltersContext.Provider value={JobFiltersValue}>
            <JobsStateContext.Provider value={JobStateValue}>
                {children}
            </JobsStateContext.Provider>
        </JobFiltersContext.Provider>
    );
};