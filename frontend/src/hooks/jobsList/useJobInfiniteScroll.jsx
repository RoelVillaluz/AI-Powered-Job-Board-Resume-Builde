import { useState, useCallback, useRef } from "react";
import { buildJobQueryParams } from "../../utils/jobPostings/filters/buildJobQueryParams";
import { mergeJobsWithRecommendations } from "../../utils/jobPostings/recommendations/mergeJobsWithRecommendations";
import { useQuery } from "@tanstack/react-query";
import { useJobStore } from "../../stores/jobStore";
import { useJobPostings, useJobRecommendations } from "../jobs/useJobQueries";

export const useJobInfiniteScroll = () => {
    const { activeFilters } = useJobStore(state => state);
    
    const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useJobPostings();
    const { data: recommendations } = useJobRecommendations();
    
    const loadMoreJobs = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
    
    return {
        jobs: data?.pages?.flatMap(page => page.jobPostings) || [],
        loading: isLoading,
        hasMoreJobs: hasNextPage,
        loadMoreJobs,
    };
};