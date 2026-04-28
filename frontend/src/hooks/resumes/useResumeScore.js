import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../stores/authStore";
import { useResumeStore } from "../../stores/resumeStore";
import { useResumeScoreQuery, useUserResumesQuery } from "./useResumeQueries";
import { useEffect, useRef, useState } from "react";
import { useSocket } from "../../contexts/SocketContext";

/**
 * Convenience hook that provides resume score data, live job progress, and a
 * time-remaining estimate for the current user's active resume.
 * 
 * 
 * @returns {{
 *   currentResume: object|null,
 *   score: number|null,
 *   jobProgress: number,
 *   secondsRemaining: number|null,
 *   loading: boolean,
 *   error: Error|null,
 *   messages: {
 *     grade: string|undefined,
 *     overallMessage: string|null
 *   },
 *   hasResume: boolean,
 *   totalResumes: number,
 *   isQueued: boolean
 * }}
 *
 * - `score`            — The final score (0–100), or null while calculating.
 * - `jobProgress`      — Unified 0–100% pipeline progress for the gauge. 100 when idle.
 * - `secondsRemaining` — Estimated seconds left, or null when not calculating.
 * - `isQueued`         — True while the embedding/score pipeline is running.
 * - `messages`         — Grade string and overall message from the score document.
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
    const [secondsRemaining, setSecondsRemaining] = useState(null);

    // useRef so time tracking doesn't trigger re-renders
    const pipelineStartTime = useRef(null);

    const { data: resumes, isLoading: resumesLoading, error: resumesError } =
        useUserResumesQuery(user?._id);

    const { data: scoreData, isLoading: scoreLoading, error: scoreError } =
        useResumeScoreQuery(currentResume?._id, token);

    useEffect(() => {
        if (!currentResume || !socket) return;

        // Treat a "queued" API response as the start of an in-progress pipeline
        if (scoreData?.status === "queued") {
            setIsQueued(true);
            setSocketMessage("Starting analysis...");
        }

        /**
         * Update unified progress and time-remaining estimate.
         *
         * @param {number} mappedProgress - Progress already mapped onto the 0–100 unified scale.
         * @param {string|undefined} message - Status message from Python, if provided.
         */
        const updateProgress = (mappedProgress, message) => {
            setIsQueued(true);
            setSocketProgress(mappedProgress);
            if (message) setSocketMessage(message);

            // Start the clock on first meaningful progress tick
            if (!pipelineStartTime.current && mappedProgress > 0) {
                pipelineStartTime.current = Date.now();
            }

            // Only estimate once we have enough elapsed data to be meaningful
            if (pipelineStartTime.current && mappedProgress >= 10) {
                const elapsedSeconds = (Date.now() - pipelineStartTime.current) / 1000;
                const secondsPerPercent = elapsedSeconds / mappedProgress;
                const remaining = Math.round(secondsPerPercent * (100 - mappedProgress));
                setSecondsRemaining(remaining);
            }
        };

        // Embedding phase occupies the first 60% of the unified gauge (raw 0–100 → 0–60)
        socket.on("embedding:progress", ({ progress, message }) => {
            updateProgress(Math.round(progress * 0.6), message);
        });

        // Score phase occupies the remaining 40% (raw 0–100 → 60–100)
        socket.on("score:progress", ({ progress, message }) => {
            updateProgress(60 + Math.round(progress * 0.4), message);
        });

        socket.on("score:complete", ({ data }) => {
            setIsQueued(false);
            setSocketProgress(100);
            setSocketMessage("Your resume score is ready!");
            setSecondsRemaining(null);
            pipelineStartTime.current = null;

            queryClient.setQueryData(["resumeScore", currentResume._id], {
                success: true,
                formattedMessage: "Resume Score fetched successfully",
                data,
            });
        });

        socket.on("score:error", ({ message }) => {
            setIsQueued(false);
            setSocketMessage(message);
            setSecondsRemaining(null);
            pipelineStartTime.current = null;
        });

        socket.on("embedding:error", ({ message }) => {
            setIsQueued(false);
            setSocketMessage(message);
            setSecondsRemaining(null);
            pipelineStartTime.current = null;
        });

        return () => {
            socket.off("embedding:progress");
            socket.off("score:progress");
            socket.off("score:complete");
            socket.off("score:error");
            socket.off("embedding:error");
        };
    }, [currentResume?._id, scoreData?.status, socket]);

    const isLoading = resumesLoading || scoreLoading;
    const error = resumesError || scoreError;

    return {
        currentResume,
        score: isQueued ? null : (scoreData?.data?.totalScore ?? null),
        jobProgress: isQueued ? socketProgress : 100,
        secondsRemaining,
        loading: isLoading,
        error,
        messages: {
            grade: scoreData?.data?.grade,
            overallMessage: isQueued
                ? socketMessage
                : (scoreData?.data?.overallMessage ?? null)
        },
        hasResume: !!currentResume,
        totalResumes: resumes?.length ?? 0,
        isQueued
    };
};