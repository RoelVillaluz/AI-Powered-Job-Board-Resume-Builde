import { useQuery } from "@tanstack/react-query";
import { fetchJobPostings, fetchJobRecommendations, fetchInteractedJobs } from "../../../api/jobApis";

export const useJobPostings = () => {
    return useQuery({
        queryKey: ['jobPostings'],
        queryFn: fetchJobPostings,
        staleTime: 1000 * 60 * 5
    })
}

export const useJobRecommendations = (userId) => {
    return useQuery({
        queryKey: ['jobRecommendations', userId],
        queryFn: () => fetchJobRecommendations(userId),
        enabled: !!userId,
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
    })
}