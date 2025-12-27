import { useState, useCallback, useRef } from "react";
import { buildJobQueryParams } from "../../utils/jobPostings/filters/buildJobQueryParams";
import { mergeJobsWithRecommendations } from "../../utils/jobPostings/recommendations/mergeJobsWithRecommendations";
import { fetchJobPostings } from "../../utils/jobPostings/api/fetchJobPostings";

export const useJobInfiniteScroll = (
    baseUrl,
    filters,
    sortBy,
    jobRecommendations = []
) => {
    const [jobs, setJobs] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasMoreJobs, setHasMoreJobs] = useState(true);
    const [isLoadingMoreJobs, setIsLoadingMoreJobs] = useState(false);

    const abortRef = useRef(null);

    const abortPrevious = () => {
        if (abortRef.current) {
            abortRef.current.abort();
        }
        abortRef.current = new AbortController();
        return abortRef.current.signal;
    };

    const fetchJobs = useCallback(async (reset = true) => {
        try {
            const signal = abortPrevious();

            if (reset) {
                setLoading(true);
                setJobs([]);
                setCursor(null);
                setHasMoreJobs(true);
            }

            const queryString = buildJobQueryParams({
                filters,
                sortBy,
                cursor: reset ? null : cursor,
                jobRecommendations
            });

            const { jobPostings, nextCursor, hasMore } =
                await fetchJobPostings({
                    baseUrl,
                    queryString,
                    signal
                });

            const merged = mergeJobsWithRecommendations(
                jobPostings || [],
                jobRecommendations
            );

            if (reset) {
                const recommendedWithScore = jobRecommendations.map(j => ({
                    ...j,
                    matchScore: j.matchScore ?? j.similarity ?? 0,
                }));

                const recommendedIds = new Set(
                    jobRecommendations.map(j => j._id)
                );

                const nonRecommended = merged.filter(
                    j => !recommendedIds.has(j._id)
                );

                setJobs([...recommendedWithScore, ...nonRecommended]);
            } else {
                setJobs(prev => [...prev, ...merged]);
            }

            setCursor(nextCursor);
            setHasMoreJobs(hasMore);
        } catch (err) {
            if (err.name !== "CanceledError") {
                console.error("Job fetch failed:", err);
                setHasMoreJobs(false);
            }
        } finally {
            setLoading(false);
        }
    }, [baseUrl, filters, sortBy, cursor, jobRecommendations]);

    const loadMoreJobs = useCallback(async () => {
        if (!cursor || isLoadingMoreJobs || !hasMoreJobs) return;

        setIsLoadingMoreJobs(true);

        try {
            const signal = abortPrevious();

            const queryString = buildJobQueryParams({
                filters,
                sortBy,
                cursor,
                jobRecommendations
            });

            const { jobPostings, nextCursor, hasMore } =
                await fetchJobPostings({
                    baseUrl,
                    queryString,
                    signal
                });

            const merged = mergeJobsWithRecommendations(
                jobPostings || [],
                jobRecommendations
            );

            setJobs(prev => [...prev, ...merged]);
            setCursor(nextCursor);
            setHasMoreJobs(hasMore);
        } catch (err) {
            if (err.name !== "CanceledError") {
                console.error("Load more failed:", err);
                setHasMoreJobs(false);
            }
        } finally {
            setIsLoadingMoreJobs(false);
        }
    }, [baseUrl, filters, sortBy, cursor, hasMoreJobs, isLoadingMoreJobs, jobRecommendations]);

    return {
        jobs,
        loading,
        hasMoreJobs,
        isLoadingMoreJobs,
        fetchJobs,
        loadMoreJobs
    };
};