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

    const { data: resumes, isLoading: resumesLoading, error: resumesError } = useUserResumesQuery(user?._id);
    const { data: scoreData, isLoading: scoreLoading, error: scoreError } = useResumeScoreQuery(currentResume?._id, token);

    useEffect(() => {
        if (!currentResume || !socket) return;

        if (scoreData?.status === 'queued') {
            setIsQueued(true);
            setSocketMessage('Calculating your resume score...');
        }

        // Embedding phase = first 50% of total progress
        socket.on('embedding:progress', ({ progress, message }) => {
            setIsQueued(true);
            setSocketProgress(Math.round(progress / 2)); // 0-100 → 0-50
            setSocketMessage(message);
        });

        // Score phase = second 50% of total progress
        socket.on('score:progress', ({ progress, message }) => {
            setIsQueued(true);
            setSocketProgress(50 + Math.round(progress / 2)); // 0-100 → 50-100
            setSocketMessage(message);
        });

        socket.on('score:complete', ({ data }) => {
            setIsQueued(false);
            setSocketProgress(100);
            setSocketMessage('Your resume score is ready!');
            queryClient.setQueryData(['resumeScore', currentResume._id], {
                data,
                status: 'ready'
            });
        });

        socket.on('score:error', ({ message }) => {
            setIsQueued(false);
            setSocketMessage(message);
        });

        socket.on('embedding:error', ({ message }) => {
            setIsQueued(false);
            setSocketMessage(message);
        });

        return () => {
            socket.off('embedding:progress');
            socket.off('score:progress');
            socket.off('score:complete');
            socket.off('score:error');
            socket.off('embedding:error');
        };
    }, [currentResume?._id, scoreData?.status, socket]);

    const isLoading = resumesLoading || scoreLoading;
    const error = resumesError || scoreError;

    return {
        currentResume,
        score: isQueued ? null : (scoreData?.data?.totalScore ?? null),
        jobProgress: isQueued ? socketProgress : 100,
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
};