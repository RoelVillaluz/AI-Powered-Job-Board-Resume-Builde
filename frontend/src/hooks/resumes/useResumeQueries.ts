import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryResult, UseQueryOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useResumeStore } from "../../stores/resumeStore";
import { useEffect } from "react";
import {
    fetchResume,
    fetchResumeEmbeddingsV2,
    fetchResumeJobSimilarity,
    fetchResumeSalaryPrediction,
    fetchResumeScoreV2,
    fetchUserResumes,
    fetchResumeJobMatches,
    fetchResumeJobMatch,
    generateMatchInsight,
} from "../../../api/resumeApis";
import type { Resume } from "../../../types/models/resume";
import type { JobMatchEntry, ResumeJobMatchDocument } from "../../types/api/resumes/resumeJobMatch.types";
import type { ResumeScore } from "../../types/api/resumes/resumeScore.types";
import type { ResumeEmbeddings } from "../../types/api/resumes/resumeEmbeddings.types";
import type { SalaryPrediction } from "../../types/api/resumes/salaryPrediction.types";
import type { GenerateInsightResponse } from "../../types/api/resumes/matchInsight.types";

/**
 * Fetch all resumes for a user and update the store's currentResume
 * @param {string} userId
 * @returns {UseQueryResult<Resume[], Error>} { data: resumes, isLoading, error }
 */
export const useUserResumesQuery = (
    userId: string | undefined
): UseQueryResult<Resume[], Error> => {
    const setCurrentResume = useResumeStore(state => state.setCurrentResume)

    const query = useQuery<Resume[], Error>({
        queryKey: ['resumes', userId],
        queryFn: () => fetchUserResumes(userId!),
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
 * @returns {UseQueryResult<Resume, Error>} { data, isLoading, error }
 */
export const useResumeQuery = (
    resumeId: string | undefined
): UseQueryResult<Resume, Error> => {
  return useQuery<Resume, Error>({
    queryKey: ['resume', resumeId],
    queryFn: () => fetchResume(resumeId!),
    enabled: !!resumeId,
    staleTime: 1000 * 60 * 5,
  })
}

export const useResumeEmbeddingsQuery = (
    resumeId: string | undefined,
    token: string | undefined
): UseQueryResult<ResumeEmbeddings, Error> => {
  return useQuery<ResumeEmbeddings, Error>({
    queryKey: ['resumeEmbeddings', resumeId],
    queryFn: () => fetchResumeEmbeddingsV2(resumeId!, token!),
    enabled: !!resumeId,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * React Query hook to fetch the score for a given resume.
 * @param {string} resumeId - The ID of the resume
 * @returns {UseQueryResult<ResumeScore, Error>} { data, isLoading, error }
 */
export const useResumeScoreQuery = (
    resumeId: string | undefined,
    token: string | undefined
): UseQueryResult<ResumeScore, Error> => {
  return useQuery<ResumeScore, Error>({
    queryKey: ['resumeScore', resumeId],
    queryFn: () => fetchResumeScoreV2(resumeId!, token!),
    enabled: !!resumeId,
    staleTime: 1000 * 60 * 5,
  })
}

export const useResumeJobSimilarityQuery = (
    resumeId: string | undefined,
    jobId: string | undefined
): UseQueryResult<Record<string, unknown>, Error> => {
  return useQuery<Record<string, unknown>, Error>({
    queryKey: ['resumeJobMatch', resumeId, jobId],
    queryFn: () => fetchResumeJobSimilarity(resumeId!, jobId!),
    enabled: !!resumeId && !!jobId,
    staleTime: 1000 * 60 * 5,
    retry: 3,
    refetchOnWindowFocus: false // avoids unnecessary refetches
  })
}

export const useResumeSalaryPredictionQuery = (
  resumeId: string | undefined,
  token: string | undefined,
  options: Omit<UseQueryOptions<SalaryPrediction, Error>, 'queryKey' | 'queryFn'> = {}
): UseQueryResult<SalaryPrediction, Error> => {
  return useQuery<SalaryPrediction, Error>({
    queryKey: ['resumeSalaryPrediction', resumeId],
    queryFn: () => fetchResumeSalaryPrediction(resumeId!, token!),

    enabled: !!resumeId && !!token,

    staleTime: 1000 * 60 * 5,
    retry: false,
    refetchOnWindowFocus: false,

    ...options
  });
};

export const useResumeJobMatchesQuery = (
    resumeId: string | undefined,
    token: string | undefined
): UseQueryResult<ResumeJobMatchDocument, Error> => {
  return useQuery<ResumeJobMatchDocument, Error>({
    queryKey: ['resumeJobMatch', resumeId],
    queryFn: () => fetchResumeJobMatches(resumeId!, token!),
    enabled: !!resumeId && !!token,
    staleTime: 1000 * 60 * 5,
    retry: false, // Falls back to generation if missing,
    refetchOnWindowFocus: false
  })
}

export const useResumeJobMatchQuery = (
    resumeId: string | undefined,
    jobId: string | undefined,
    token: string | undefined
): UseQueryResult<JobMatchEntry, Error> => {
    return useQuery<JobMatchEntry, Error>({
        queryKey: ['resumeJobMatch', resumeId, jobId],
        queryFn: () => fetchResumeJobMatch(resumeId!, jobId!, token!),
        enabled: !!resumeId && !!jobId && !!token,
        staleTime: 1000 * 60 * 10,
        retry: (failureCount, error) => {
            if (error instanceof AxiosError && error.response?.status === 404) return false;
            return failureCount < 2;
        },
    });
};

export const useGenerateMatchInsightMutation = () => {
    return useMutation<GenerateInsightResponse, Error, { resumeId: string; jobId: string; token: string }>({
        mutationFn: ({ resumeId, jobId, token }) => generateMatchInsight(resumeId, jobId, token),
        onError: (err) => {
            console.error('[useGenerateMatchInsightMutation] Failed to start insight generation', err);
        },
    });
};
