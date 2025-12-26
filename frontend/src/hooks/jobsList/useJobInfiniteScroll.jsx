import { useState, useCallback } from "react";
import axios from "axios";

export const useJobInfiniteScroll = (baseUrl, filters, sortBy, jobRecommendations = []) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cursor, setCursor] = useState(null);
    const [hasMoreJobs, setHasMoreJobs] = useState(true);
    const [isLoadingMoreJobs, setIsLoadingMoreJobs] = useState(false);

    // Build query params from filters
    const buildQueryParams = useCallback((additionalCursor = null) => {
        const params = new URLSearchParams();
        
        // Salary
        if (filters.salary.amount.min) params.append('minSalary', filters.salary.amount.min);
        if (filters.salary.amount.max) params.append('maxSalary', filters.salary.amount.max);
        
        // Arrays - join with commas
        if (filters.jobType.length > 0) params.append('jobType', filters.jobType.join(','));
        if (filters.experienceLevel.length > 0) params.append('experienceLevel', filters.experienceLevel.join(','));
        if (filters.skills.length > 0) params.append('skills', filters.skills.join(','));
        if (filters.industry.length > 0) params.append('industry', filters.industry.join(','));
        
        // String filters
        if (filters.jobTitle) params.append('jobTitle', filters.jobTitle);
        if (filters.location) params.append('location', filters.location);
        
        // Boolean/special
        if (filters.hasQuestions) params.append('hasQuestions', 'true');
        
        // Date posted - convert to backend format
        const dateMap = {
            'Anytime': null,
            'Today': 'today',
            'This Week': 'this_week',
            'This Month': 'this_month',
            'Last 3 Months': 'last_3_months'
        };
        const dateValue = dateMap[filters.datePosted];
        if (dateValue) params.append('datePosted', dateValue);
        
        // Sort by - convert to backend format
        const sortMap = {
            'Best Match (Default)': 'Best Match',
            'A-Z': 'A-Z',
            'Z-A': 'Z-A',
            'Newest First': 'Newest First',
            'Highest Salary': 'Highest Salary'
        };
        params.append('sortBy', sortMap[sortBy] || 'Best Match');
        
        // Pagination
        if (additionalCursor) params.append('cursor', additionalCursor);
        params.append('limit', '20');
        
        // Exclude recommended job IDs to avoid duplicates
        if (jobRecommendations.length > 0 && !additionalCursor) {
            const excludeIds = jobRecommendations.map(job => job._id).join(',');
            params.append('exclude', excludeIds);
        }
        
        return params.toString();
    }, [filters, sortBy, jobRecommendations]);

    // Merge similarity scores from recommended jobs into fetched jobs
    const mergeJobsWithSimilarity = useCallback((fetchedJobs) => {
        return fetchedJobs.map(job => {
            const recommendedJob = jobRecommendations.find(rec => rec._id === job._id);
            if (recommendedJob) {
                return {
                    ...job,
                    similarity: recommendedJob.similarity,
                    matchScore: recommendedJob.matchScore || recommendedJob.similarity
                };
            }
            return job;
        });
    }, [jobRecommendations]);

    // Fetch jobs with current filters
    const fetchJobs = useCallback(async (resetCursor = true) => {
        try {
            if (resetCursor) {
                setLoading(true);
                setJobs([]);
                setCursor(null);
            }
            
            const queryString = buildQueryParams(resetCursor ? null : cursor);
            const response = await axios.get(`${baseUrl}/job-postings?${queryString}`);
            
            const { jobPostings, nextCursor, hasMore } = response.data.data;
            
            // Merge with similarity scores from recommended jobs
            const jobsWithSimilarity = mergeJobsWithSimilarity(jobPostings || []);
            
            if (resetCursor) {
                // On initial load, combine recommended jobs with fetched jobs
                const recommendedIds = jobRecommendations.map(job => job._id);
                
                // Add matchScore to recommended jobs if missing
                const recommendedWithMatchScore = jobRecommendations.map(job => ({
                    ...job,
                    matchScore: job.matchScore || job.similarity || 0
                }));
                
                // Only include non-recommended jobs from fetch
                const nonRecommended = jobsWithSimilarity.filter(
                    job => !recommendedIds.includes(job._id)
                );
                
                // Prioritize recommended jobs first
                setJobs([...recommendedWithMatchScore, ...nonRecommended]);
            } else {
                setJobs(prev => [...prev, ...jobsWithSimilarity]);
            }
            
            setCursor(nextCursor);
            setHasMoreJobs(hasMore);
        } catch (error) {
            console.error("Error fetching jobs:", error);
            setJobs([]);
            setHasMoreJobs(false);
        } finally {
            setLoading(false);
        }
    }, [baseUrl, buildQueryParams, cursor, mergeJobsWithSimilarity, jobRecommendations]);

    // Load more jobs (infinite scroll)
    const loadMoreJobs = useCallback(async () => {
        if (isLoadingMoreJobs || !hasMoreJobs || !cursor) return;

        setIsLoadingMoreJobs(true);
        try {
            const queryString = buildQueryParams(cursor);
            const response = await axios.get(`${baseUrl}/job-postings?${queryString}`);
            
            const { jobPostings, nextCursor, hasMore } = response.data.data;
            
            if (jobPostings && jobPostings.length > 0) {
                const jobsWithSimilarity = mergeJobsWithSimilarity(jobPostings);
                setJobs(prev => [...prev, ...jobsWithSimilarity]);
                setCursor(nextCursor);
                setHasMoreJobs(hasMore);
            } else {
                setHasMoreJobs(false);
            }
        } catch (error) {
            console.error("Error loading more jobs:", error);
            setHasMoreJobs(false);
        } finally {
            setIsLoadingMoreJobs(false);
        }
    }, [baseUrl, buildQueryParams, cursor, hasMoreJobs, isLoadingMoreJobs, mergeJobsWithSimilarity]);

    return {
        jobs,
        loading,
        setLoading,
        hasMoreJobs,
        isLoadingMoreJobs,
        fetchJobs,
        loadMoreJobs
    };
};