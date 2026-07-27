import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "../../contexts/SocketContext";
import { useAuthStore } from "../../stores/authStore";
import { useResumeStore } from "../../stores/resumeStore";
import { useResumeJobMatchesQuery } from "./useResumeQueries";
import { useResumeJobMatchMutation } from "./useResumeMutations";
import type { AxiosError } from "axios";

/**
 * useResumeJobMatches
 *
 * Orchestrates the resume-job matching pipeline using React Query + Socket.IO.
 *
 * PIPELINE FLOW:
 * 1. GET /resumes/:resumeId/job-matches
 * 2. If 404 (no matches yet) → POST to enqueue matching pipeline
 * 3. Listen for matching:complete socket event
 * 4. Seed cache with result — no extra GET needed
 *
 * SOCKET EVENTS:
 * - matching:progress → live progress updates (0–100)
 * - matching:complete → pipeline finished, result available
 * - matching:error    → pipeline failed
 *
 * @returns {Object}
 * @property {Array}   matches       - Ranked job matches array
 * @property {boolean} isGenerating  - Pipeline currently running
 * @property {number}  progress      - Live progress 0–100
 * @property {string}  statusMessage - Human-readable status
 * @property {boolean} isLoading     - Initial fetch loading
 */
export const useResumeJobMatches = () => {
    const { socket }        = useSocket();
    const token             = useAuthStore(state => state.token);
    const currentResume     = useResumeStore(state => state.currentResume);
    const queryClient       = useQueryClient();

    const resumeId = currentResume?._id;

    const [isGenerating,  setIsGenerating]  = useState(false);
    const [progress,      setProgress]      = useState(0);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    useEffect(() => {
        setIsGenerating(false);
        setProgress(0);
        setStatusMessage(null);
    }, [resumeId]);

    const { data, isLoading, isFetched, error } = useResumeJobMatchesQuery(resumeId, token);

    const { mutate: triggerGeneration } = useResumeJobMatchMutation(resumeId, token);
    
    useEffect(() => {
        const axiosError = error as AxiosError | null;
        if (
            isFetched &&
            !data &&
            axiosError?.response?.status === 404 &&
            resumeId &&
            token &&
            !isGenerating
        ) {
            setIsGenerating(true);
            setStatusMessage("Finding your best job matches...");
            triggerGeneration();
        }
    }, [isFetched, data, error, resumeId, token, isGenerating]);

    useEffect(() => {
        if (!socket || !resumeId) return;

        socket.on("matching:progress", ({ progress: p, message }: { progress: number; message?: string }) => {
            setProgress(p ?? 0);
            if (message) setStatusMessage(message);
        });

        socket.on("matching:complete", ({ data: result }: { data: any }) => {
            setIsGenerating(false);
            setProgress(0);
            setStatusMessage(null);
            queryClient.setQueryData(['resumeJobMatch', resumeId], result);
        });

        socket.on("matching:error", ({ message }: { message: string }) => {
            setIsGenerating(false);
            setProgress(0);
            setStatusMessage(message ?? "Matching failed — please try again");
        });

        return () => {
            socket.off("matching:progress");
            socket.off("matching:complete");
            socket.off("matching:error");
        };
    }, [socket, resumeId, queryClient]);

    return {
        matches:      data?.matches ?? [],
        isGenerating,
        progress,
        statusMessage,
        isLoading,
        totalMatches: data?.totalMatches ?? 0,
        usedPinecone: data?.usedPinecone ?? false,
    };
};