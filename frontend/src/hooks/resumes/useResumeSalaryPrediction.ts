import { useEffect, useRef, useState } from "react";
import { useQueryClient, UseQueryResult }  from "@tanstack/react-query";
import { useSocket }       from "../../contexts/SocketContext";
import { useAuthStore }    from "../../stores/authStore";
import { useResumeStore }  from "../../stores/resumeStore";
import { useResumeSalaryPredictionQuery, useResumeScoreQuery } from "./useResumeQueries";
import { generateResumeSalaryPrediction } from "../../services/resumeServices";

interface ResumeScore {
    totalScore: number;
    grade: string;
    overallMessage: string;
}

export const useResumeSalaryPrediction = () => {
    const { socket } = useSocket();
    const token      = useAuthStore(state => state.token);
    const resume     = useResumeStore(state => state.currentResume);
    const resumeId   = resume?._id;
    const queryClient = useQueryClient();

    const [isGenerating,  setIsGenerating]  = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const hasTriggeredRef = useRef(false);

    // Reset when resume changes
    useEffect(() => {
        hasTriggeredRef.current = false;
        setIsGenerating(false);
        setStatusMessage(null);
    }, [resumeId]);

    // ── 1. GET salary prediction ──────────────────────────────────────────────
    const {
        data:     queryData,
        isLoading,
        isFetched,
    } = useResumeSalaryPredictionQuery(resumeId, token);

    // ── 2. GET resume score — salary prediction requires score to exist ────────
    // Salary prediction uses resume score as an input signal.
    // Without it the prediction confidence is very low.
    const { data: scoreData, isFetched: scoreFetched } =
        useResumeScoreQuery(resumeId, token) as UseQueryResult<ResumeScore>;

    // ── 3. Auto-trigger if no prediction and score exists ─────────────────────
    useEffect(() => {
        if (!resumeId || !token)       return;
        if (!isFetched)                return; // salary GET still in-flight
        if (!scoreFetched)             return; // score GET still in-flight
        if (!scoreData)                return; // score doesn't exist yet — wait
        if (queryData)                 return; // prediction exists — nothing to do
        if (hasTriggeredRef.current)   return; // already triggered this session
        if (isGenerating)              return;

        hasTriggeredRef.current = true;
        setIsGenerating(true);
        setStatusMessage("Predicting your salary...");

        generateResumeSalaryPrediction(resumeId, token).catch(err => {
            console.error("[useResumeSalaryPrediction] Generation failed:", err);
            setIsGenerating(false);
            setStatusMessage(null);
            hasTriggeredRef.current = false; // allow retry
        });

    }, [resumeId, token, isFetched, scoreFetched, scoreData, queryData, isGenerating]);

    // ── 4. Socket listeners ───────────────────────────────────────────────────
    useEffect(() => {
        if (!socket || !resumeId) return;

        socket.on("salary:progress", ({ progress, message }: { progress: number; message?: string }) => {
            if (message) setStatusMessage(message);
        });

        socket.on("salary:complete", ({ data: result }: { data: any }) => {
            setIsGenerating(false);
            setStatusMessage(null);
            // Seed cache directly — no extra GET needed
            queryClient.setQueryData(['resumeSalaryPrediction', resumeId], result);
        });

        socket.on("salary:error", ({ message }: { message: string }) => {
            setIsGenerating(false);
            setStatusMessage(null);
            hasTriggeredRef.current = false; // allow retry on next mount
            console.error("[useResumeSalaryPrediction] Pipeline error:", message);
        });

        return () => {
            socket.off("salary:progress");
            socket.off("salary:complete");
            socket.off("salary:error");
        };
    }, [socket, resumeId, queryClient]);

    return {
        predictedSalary: queryData ?? null,
        isGenerating,
        statusMessage,
        isLoading,
        isFetched,
    };
};