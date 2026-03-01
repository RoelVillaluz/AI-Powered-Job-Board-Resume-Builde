import { useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "../../stores/authStore"
import { useResumeStore } from "../../stores/resumeStore"
import { useResumeScoreQuery, useUserResumesQuery } from "./useResumeQueries"
import { useEffect, useState } from "react"
import { useSocket } from "../../contexts/SocketContext"

/**
 * Convenience hook to get both resume and score for the current user.
 * Handles the full flow: fetch resumes → set current → fetch score
 * @returns {Object} { currentResume, progress, loading, error, messages }
 */
export const useResumeScore = () => {
    const { socket } = useSocket();
    const user = useAuthStore(state => state.user);
    const token = useAuthStore(state => state.token);
    const currentResume = useResumeStore(state => state.currentResume);
    const queryClient = useQueryClient();

    const [socketProgress, setSocketProgress] = useState(0);
    const [socketMessage, setSocketMessage] = useState(null);
    const [isQueued, setIsQueued] = useState(false);

    // Step 1: Fetch all resumes for the user
    // This will automatically set currentResume via useEffect in useUserResumesQuery
    const { data: resumes, isLoading: resumesLoading, error: resumesError } = useUserResumesQuery(user?._id)

    // Step 2: Fetch score only when currentResume exists
    const { data: scoreData, isLoading: scoreLoading, error: scoreError } = useResumeScoreQuery(currentResume?._id, token)

    useEffect(() => {
        if (!currentResume || !socket) return;

        // Job was queued - listen for socket events
        if (scoreData?.status === 'queued') {
            setIsQueued(true);
            setSocketMessage('Calculating your resume score...');
        }

        socket.on('score:progress', ({ progress, message}) => {
            setSocketProgress(progress);
            setSocketMessage(message);
        })

        socket.on('score:complete', ({ data }) => {
            setIsQueued(false);
            setSocketProgress(100);
            setSocketMessage('Your resume score is ready!');
            queryClient.setQueryData(['resumeScore', currentResume._id], {
                data,
                status: 'ready'
            });
        })

        socket.on('score:error', ({ message }) => {
            setIsQueued(false);
            setSocketMessage(message);
        });

        return () => {
            socket.off('score:progress');
            socket.off('score:complete');
            socket.off('score:error');
        };
    }, [currentResume?._id, scoreData?.status]);

    // Determine overall loading state
    const isLoading = resumesLoading || scoreLoading

    // Combine errors
    const error = resumesError || scoreError

    const progress = isQueued
        ? socketProgress
        : (scoreData?.data?.totalScore ?? 0);

    return {
        currentResume,
        progress,
        loading: isLoading,
        error,
        messages: {
            grade: scoreData?.data?.grade,
            overallMessage: isQueued ? socketMessage : (scoreData?.data?.overallMessage ?? null)
        },
        hasResume: !!currentResume,
        totalResumes: resumes?.length ?? 0,
        isQueued
    };
}