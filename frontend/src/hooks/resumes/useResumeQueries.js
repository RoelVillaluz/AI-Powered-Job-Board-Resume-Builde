import { useQuery } from "@tanstack/react-query"
import { useResumeStore } from "../../stores/resumeStore";
import { fetchResume, fetchResumeScore, fetchUserResumes } from "../../../api/resumeApis";
import { useEffect } from "react";

/**
 * Fetch all resumes for a user and update the store's currentResume
 * @param {string} userId
 * @returns {Object} { data: resumes, isLoading, error }
 */
export const useUserResumesQuery = (userId) => {
    const setCurrentResume = useResumeStore(state => state.setCurrentResume)

    const query = useQuery({
        queryKey: ['resumes', userId],
        queryFn: () => fetchUserResumes(userId),
        enabled: !!userId, // only fetch when userId exists
        staleTime: 1000 * 60 * 5,
    })

    // Use useEffect instead of deprecated onSuccess
    useEffect(() => {
        if (query.data?.length && !useResumeStore.getState().currentResume) {
            setCurrentResume(query.data[0]) // first resume becomes current
        }
    }, [query.data, setCurrentResume])

    return query
}


/**
 * React Query hook to fetch the current user's resume.
 * @param {string} resumeId - The ID of the resume
 * @returns {Object} { data, isLoading, error }
 */
export const useResumeQuery = (resumeId) => {
  return useQuery({
    queryKey: ['resume', resumeId],
    queryFn: () => fetchResume(resumeId),
    enabled: !!resumeId,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * React Query hook to fetch the score for a given resume.
 * @param {string} resumeId - The ID of the resume
 * @returns {Object} { data, isLoading, error }
 */
export const useResumeScoreQuery = (resumeId) => {
  return useQuery({
    queryKey: ['resumeScore', resumeId],
    queryFn: () => fetchResumeScore(resumeId),
    enabled: !!resumeId, 
    staleTime: 1000 * 60 * 5,
  })
}