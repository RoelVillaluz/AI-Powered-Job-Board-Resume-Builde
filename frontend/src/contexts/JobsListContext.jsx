import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef
} from "react";

import { useData } from "./DataProvider";

import { useJobFilterLogic } from "../hooks/jobsList/useJobFilterLogic";
import { useJobSorting } from "../hooks/jobsList/useJobSorting";
import { useJobInfiniteScroll } from "../hooks/jobsList/useJobInfiniteScroll";
import { useClientSideFilters } from "../hooks/jobsList/useClientSideFilters";
import { useResumeSkills } from "../hooks/resumes/useResumeSkills";
import { useDebounce } from "../hooks/useDebounce";

const JobFiltersContext = createContext();
const JobsStateContext = createContext();

export const useJobFilters = () => {
    const context = useContext(JobFiltersContext);
    if (!context) {
        throw new Error("useJobFilters must be used within a JobsListProvider");
    }
    return context;
};

export const useJobsState = () => {
    const context = useContext(JobsStateContext);
    if (!context) {
        throw new Error("useJobsState must be used within a JobsListProvider");
    }
    return context;
};

export const JobsListProvider = ({ children }) => {
    const user = useAuthStore(state => state.user);
    const {
        baseUrl,
        fetchResumes,
        resumes,
        jobRecommendations,
        fetchJobRecommendations
    } = useData();

    const hasFetchedResumes = useRef(false);
    const hasFetchedRecommendations = useRef(false);

    /* ============================
       Resume + recommendations
    ============================ */

    const allResumeSkills = useResumeSkills(resumes);

    useEffect(() => {
        if (user?._id && !hasFetchedResumes.current) {
            hasFetchedResumes.current = true;
            fetchResumes(user._id);
        }
    }, [user?._id]);

    useEffect(() => {
        if (resumes.length > 0 && !hasFetchedRecommendations.current) {
            hasFetchedRecommendations.current = true;
            fetchJobRecommendations();
        }
    }, [resumes.length]);

    /* ============================
       Filters + sorting
    ============================ */

    const filterLogic = useJobFilterLogic(allResumeSkills);
    const { filters } = filterLogic;

    const sortingLogic = useJobSorting();
    const { sortBy } = sortingLogic;

    /* ============================
       🔥 Debounced values
    ============================ */

    const debouncedFilters = useDebounce(filters, 400);
    const debouncedSortBy = useDebounce(sortBy, 400);

    /* ============================
       API + infinite scroll
    ============================ */

    const infiniteScrolledJob = useJobInfiniteScroll(
        baseUrl,
        debouncedFilters,
        debouncedSortBy,
        jobRecommendations
    );

    const { fetchJobs } = infiniteScrolledJob;

    useEffect(() => {
        if (resumes.length > 0 && jobRecommendations.length >= 0) {
            fetchJobs(true);
        }
    }, [
        debouncedFilters,
        debouncedSortBy,
        resumes.length,
        jobRecommendations.length
    ]);

    /* ============================
       Client-side filters
    ============================ */

    const filteredJobs = useClientSideFilters(
        infiniteScrolledJob.jobs,
        filters,
        user
    );

    /* ============================
       Context values
    ============================ */

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