import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetchJobPostings, fetchJobPosting, fetchJobRecommendations, fetchInteractedJobs } from "../../../api/jobApis";
import { useJobStore } from "../../stores/jobStore";

export const useJobPostings = () => {
    const activeFilters = useJobStore(state => state.activeFilters);
    const sortBy = useJobStore(state => state.sortBy);
    
    return useInfiniteQuery({
        queryKey: ['jobPostings', activeFilters, sortBy],
        queryFn: ({ pageParam = null }) =>
            fetchJobPostings({
                filters: activeFilters,
                sortBy: sortBy,
                cursor: pageParam,
                limit: 20,
            }),
        getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
        staleTime: 1000 * 60 * 5,
        retry: 3,
        initialPageParam: null,
    });
};

export const useJobPosting = (id) => {
    return useQuery({
        queryKey: ['jobPosting', id],
        queryFn: () => fetchJobPosting(id),
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
        retry: 3
    })
}

export const useJobRecommendations = (userId) => {
    return useQuery({
        queryKey: ['jobRecommendations', userId],
        queryFn: () => fetchJobRecommendations(userId),
        enabled: !!userId,
        retry: 3,
        staleTime: 1000 * 60 * 5
    })
}

export const useInteractedJobs = (userId, token) => {
    return useQuery({
        queryKey: ['interactedJobs', userId],
        queryFn: async () => {
        if (!token) throw new Error('No auth token provided')
        const { data } = await axios.get(`${BASE_API_URL}/users/${userId}/interacted-jobs`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        return data.data
        },
        enabled: !!userId && !!token, // only run if both exist
        retry: 3,
    })
}