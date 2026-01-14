import { useCallback, useMemo} from "react";
import { mergeJobsWithRecommendations } from "../../utils/jobPostings/recommendations/mergeJobsWithRecommendations";
import { useJobPostings, useJobRecommendations } from "../jobs/useJobQueries";
import { useAuthStore } from "../../stores/authStore";
import { useJobStore } from "../../stores/jobStore";

/**
 * Custom hook for handling infinite scrolling of job listings.
 *
 * Combines paginated job postings with recommendation data
 * and exposes a simplified API for loading more jobs as the
 * user scrolls.
 *
 * Data fetching is handled via React Query, while filter state
 * is sourced from the job store.
 *
 * @returns {Object} Infinite scroll state and helpers
 * @returns {Array<Object>} returns.jobs
 *   Flattened array of job postings from all fetched pages
 * @returns {boolean} returns.loading
 *   Whether the initial job data is currently loading
 * @returns {boolean} returns.hasMoreJobs
 *   Indicates if more job postings are available to fetch
 * @returns {Function} returns.loadMoreJobs
 *   Callback to fetch the next page of job postings
 */
export const useJobInfiniteScroll = () => {
    const user = useAuthStore(state => state.user);
    const sortBy = useJobStore(state => state.sortBy);

    const {
        data,
        isLoading,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
    } = useJobPostings();

    const { data: recommendations = [] } = useJobRecommendations(user?._id);

    const loadMoreJobs = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const jobs = useMemo(() => {
        const flatJobs =
            data?.pages?.flatMap(page => page.jobPostings) ?? [];

        const merged = mergeJobsWithRecommendations(flatJobs, recommendations);

        if (sortBy === "Best Match (Default)") {
            return [...merged].sort((a, b) => {
                const scoreDiff = (b.matchScore ?? 0) - (a.matchScore ?? 0);
                if (scoreDiff !== 0) return scoreDiff;

                // secondary sort: newest
                return new Date(b.postedAt) - new Date(a.postedAt);
            });
        }

        return merged;
    }, [data, recommendations, sortBy]);

    return {
        jobs,
        loading: isLoading,
        hasMoreJobs: hasNextPage,
        loadMoreJobs,
        isFetchingNextPage,
    };
};