import { useState, useCallback } from "react";
import axios from "axios";

export const useJobInfiniteScroll = (
    baseUrl,
    filters,
    sortBy,
    jobRecommendations = []
) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cursor, setCursor] = useState(null);
    const [hasMoreJobs, setHasMoreJobs] = useState(true);
    const [isLoadingMoreJobs, setIsLoadingMoreJobs] = useState(false);

    const buildQueryParams = useCallback(
        (additionalCursor = null) => {
            const params = new URLSearchParams();

            // Salary (allow 0)
            if (filters.salary.amount.min != null) {
                params.append("minSalary", filters.salary.amount.min);
            }
            if (filters.salary.amount.max != null) {
                params.append("maxSalary", filters.salary.amount.max);
            }

            // Arrays
            if (filters.jobType.length) {
                params.append("jobType", filters.jobType.join(","));
            }
            if (filters.experienceLevel.length) {
                params.append("experienceLevel", filters.experienceLevel.join(","));
            }
            if (filters.skills.length) {
                params.append("skills", filters.skills.join(","));
            }
            if (filters.industry.length) {
                params.append("industry", filters.industry.join(","));
            }

            // Strings
            if (filters.jobTitle) params.append("jobTitle", filters.jobTitle);
            if (filters.location) params.append("location", filters.location);

            // Boolean
            if (filters.hasQuestions) params.append("hasQuestions", "true");

            // Date posted
            const dateMap = {
                Anytime: null,
                Today: "today",
                "This Week": "this_week",
                "This Month": "this_month",
                "Last 3 Months": "last_3_months",
            };

            const dateValue = dateMap[filters.datePosted];
            if (dateValue) params.append("datePosted", dateValue);

            // Sort
            const sortMap = {
                "Best Match (Default)": "Best Match",
                "A-Z": "A-Z",
                "Z-A": "Z-A",
                "Newest First": "Newest First",
                "Highest Salary": "Highest Salary",
            };

            params.append("sortBy", sortMap[sortBy] || "Best Match");

            // Pagination
            if (additionalCursor) params.append("cursor", additionalCursor);
            params.append("limit", "20");

            // Exclude recommended jobs on initial load
            if (jobRecommendations.length && !additionalCursor) {
                const excludeIds = jobRecommendations.map(job => job._id).join(",");
                params.append("exclude", excludeIds);
            }

            return params.toString();
        },
        [filters, sortBy, jobRecommendations]
    );

    const mergeJobsWithSimilarity = useCallback(
        fetchedJobs =>
            fetchedJobs.map(job => {
                const rec = jobRecommendations.find(r => r._id === job._id);
                if (!rec) return job;

                return {
                    ...job,
                    similarity: rec.similarity,
                    matchScore: rec.matchScore ?? rec.similarity ?? 0,
                };
            }),
        [jobRecommendations]
    );

    const fetchJobs = useCallback(
        async (resetCursor = true) => {
            try {
                if (resetCursor) {
                    setLoading(true);
                    setJobs([]);
                    setCursor(null);
                }

                const queryString = buildQueryParams(resetCursor ? null : cursor);
                const { data } = await axios.get(
                    `${baseUrl}/job-postings?${queryString}`
                );

                const { jobPostings, nextCursor, hasMore } = data.data;

                const jobsWithSimilarity = mergeJobsWithSimilarity(jobPostings || []);

                if (resetCursor) {
                    const recommendedIds = jobRecommendations.map(j => j._id);

                    const recommendedWithScore = jobRecommendations.map(job => ({
                        ...job,
                        matchScore: job.matchScore ?? job.similarity ?? 0,
                    }));

                    const nonRecommended = jobsWithSimilarity.filter(
                        job => !recommendedIds.includes(job._id)
                    );

                    setJobs([...recommendedWithScore, ...nonRecommended]);
                } else {
                    setJobs(prev => [...prev, ...jobsWithSimilarity]);
                }

                setCursor(nextCursor);
                setHasMoreJobs(hasMore);
            } catch (err) {
                console.error("Error fetching jobs:", err);
                setJobs([]);
                setHasMoreJobs(false);
            } finally {
                setLoading(false);
            }
        },
        [
            baseUrl,
            buildQueryParams,
            cursor,
            mergeJobsWithSimilarity,
            jobRecommendations,
        ]
    );

    const loadMoreJobs = useCallback(
        async () => {
            if (isLoadingMoreJobs || !hasMoreJobs || !cursor) return;

            setIsLoadingMoreJobs(true);

            try {
                const queryString = buildQueryParams(cursor);
                const { data } = await axios.get(
                    `${baseUrl}/job-postings?${queryString}`
                );

                const { jobPostings, nextCursor, hasMore } = data.data;

                if (!jobPostings?.length) {
                    setHasMoreJobs(false);
                    return;
                }

                const jobsWithSimilarity = mergeJobsWithSimilarity(jobPostings);
                setJobs(prev => [...prev, ...jobsWithSimilarity]);
                setCursor(nextCursor);
                setHasMoreJobs(hasMore);
            } catch (err) {
                console.error("Error loading more jobs:", err);
                setHasMoreJobs(false);
            } finally {
                setIsLoadingMoreJobs(false);
            }
        },
        [
            baseUrl,
            buildQueryParams,
            cursor,
            hasMoreJobs,
            isLoadingMoreJobs,
            mergeJobsWithSimilarity,
        ]
    );

    return {
        jobs,
        loading,
        hasMoreJobs,
        isLoadingMoreJobs,
        fetchJobs,
        loadMoreJobs,
    };
};
