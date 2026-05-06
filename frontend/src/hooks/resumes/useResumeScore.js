import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "../../contexts/SocketContext";
import { useAuthStore } from "../../stores/authStore";
import { useResumeStore } from "../../stores/resumeStore";
import { useResumeScoreQuery, useUserResumesQuery } from "./useResumeQueries";
import {
    fetchResumeEmbeddingsV2,
} from "../../../api/resumeApis";
import {
    generateResumeEmbeddingsV2,
    generateResumeScoreV2,
} from "../../services/resumeServices";

/**
 * useResumeScore
 *
 * Orchestrates the full resume scoring pipeline using React Query + Socket.IO:
 *
 * PIPELINE FLOW:
 * 1. Check if resume already has a score
 * 2. If missing → fetch embeddings
 * 3. If embeddings missing → generate embeddings
 * 4. Generate resume score
 * 5. Track real-time progress via socket events
 * 6. Normalize embedding + scoring progress into unified 0–100 scale
 * 7. Finalize with a brief 100% "completion buffer" before caching result
 *
 * SOCKET PROGRESS MODEL:
 * - embedding:progress → mapped to 0–60%
 * - score:progress → mapped to 60–100%
 * - score:complete → forces 100% then finalizes after short delay
 *
 * STATE NOTES:
 * - isActive = pipeline currently running (queued but not complete)
 * - isCompletingRef prevents late socket updates from overriding completion state
 * - getJobProgress() ensures correct UI progression state:
 *   - 0 → nothing started
 *   - 0–100 → live pipeline
 *   - 100 → completed score exists
 *
 * UX BEHAVIOR:
 * - Progress always visually reaches 100% before final score appears
 * - Final state is delayed slightly for smoother UI transition
 * - Socket events are ignored once completion phase starts
 *
 * @returns {Object} Resume scoring pipeline state
 *
 * @property {Object} currentResume - Selected resume object
 * @property {number|null} score - Final computed resume score (null while processing)
 * @property {number} jobProgress - Unified progress (0–100 or 100 when complete)
 * @property {number|null} secondsRemaining - Estimated time remaining in seconds
 * @property {boolean} loading - Whether initial queries are loading
 * @property {Error|null} error - Fetch or mutation errors
 *
 * @property {Object} messages - UI messages from pipeline
 * @property {string|null} messages.grade - Final grade (A/B/C etc.)
 * @property {string|null} messages.overallMessage - Status/progress message
 *
 * @property {boolean} hasResume - Whether a resume is currently selected
 * @property {number} totalResumes - Total resumes for user
 * @property {boolean} isQueued - Whether pipeline is actively running
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
    const [isComplete, setIsComplete] = useState(false);
    const [secondsRemaining, setSecondsRemaining] = useState(null);
    const pipelineStartTime = useRef(null);

    const resumeId = currentResume?._id;

    const completionTimeout = useRef(null);
    const isCompletingRef = useRef(false);

    // reset all pipeline state when resume changes
    useEffect(() => {
        setIsQueued(false);
        setIsComplete(false);
        setSocketProgress(0);
        setSocketMessage(null);
        setSecondsRemaining(null);
        pipelineStartTime.current = null;
    }, [resumeId]);

    const { data: resumes, isLoading: resumesLoading, error: resumesError } =
        useUserResumesQuery(user?._id);

    // ── 1. GET score ──────────────────────────────────────────────────────────
    const {
        data: scoreData,
        isLoading: scoreLoading,
        isFetched: scoreFetched,
        error: scoreError,
    } = useResumeScoreQuery(resumeId, token);

    // ── 2. GET embeddings (only when score missing) ───────────────────────────
    const {
        data: embeddingsData,
        isFetched: embeddingsFetched,
    } = useQuery({
        queryKey: ['resumeEmbeddings', resumeId],
        queryFn:  () => fetchResumeEmbeddingsV2(resumeId, token),
        enabled:  !!resumeId && !!token && scoreFetched && !scoreData,
        retry:    false,
    });

    // ── 3. POST score ─────────────────────────────────────────────────────────
    const { mutate: generateScore } = useMutation({
        mutationFn: () => generateResumeScoreV2(resumeId, token),
        onSuccess: (data) => {
            if (data?.status === 'embeddings_required') {
                generateEmbeddings();
                return;
            }
            setIsQueued(true);
            setSocketMessage("Calculating your score...");
        },
        onError: (err) => setSocketMessage(err.message),
    });

    // ── 4. POST embeddings ────────────────────────────────────────────────────
    const { mutate: generateEmbeddings } = useMutation({
        mutationFn: () => generateResumeEmbeddingsV2(resumeId, token),
        onSuccess: () => {
            setIsQueued(true);
            setSocketMessage("Generating embeddings...");
        },
        onError: (err) => setSocketMessage(err.message),
    });

    // ── Orchestration ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!scoreFetched || !resumeId) return;
        if (isQueued || isComplete) return;  // ← don't re-trigger while running or done
        if (scoreData) return;               // score exists — nothing to do
        if (!embeddingsFetched) return;      // waiting for embeddings query

        if (embeddingsData) {
            generateScore();
        } else {
            generateEmbeddings();
        }
    }, [scoreFetched, embeddingsFetched, scoreData, embeddingsData, resumeId, isQueued, isComplete]);

    // ── Socket listeners ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!socket || !resumeId) return;

        const updateProgress = (mappedProgress, message) => {
            setIsQueued(true);
            setSocketProgress(mappedProgress);
            if (message) setSocketMessage(message);

            if (!pipelineStartTime.current && mappedProgress > 0) {
                pipelineStartTime.current = Date.now();
            }

            if (pipelineStartTime.current && mappedProgress >= 10) {
                const elapsed = (Date.now() - pipelineStartTime.current) / 1000;
                const rate = elapsed / mappedProgress;
                setSecondsRemaining(Math.round(rate * (100 - mappedProgress)));
            }
        };

        // embedding:progress → 0-60% of unified gauge
        socket.on("embedding:progress", ({ progress, message }) => {
            updateProgress(Math.round(progress * 0.6), message);
        });

        // score:progress → 60-100% of unified gauge
        socket.on("score:progress", ({ progress, message }) => {
            updateProgress(60 + Math.round(progress * 0.4), message);
        });

        socket.on("score:complete", ({ data }) => {
            isCompletingRef.current = true;

            setSocketProgress(100);
            setSocketMessage("Finalizing...");

            setTimeout(() => {
                setIsQueued(false);
                setIsComplete(true);
                setSocketProgress(0);
                setSocketMessage(null);
                setSecondsRemaining(null);
                pipelineStartTime.current = null;

                isCompletingRef.current = false;

                queryClient.setQueryData(["resumeScore", resumeId], data);
            }, 1000);
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

            if (completionTimeout.current) {
                clearTimeout(completionTimeout.current);
            }
        };
    }, [socket, resumeId]);

    // pipeline is active only while queued and not yet complete
    const isActive = isQueued && !isComplete;

    const getJobProgress = () => {
        if (isActive) return socketProgress;      // pipeline running — show live progress
        if (scoreData?.totalScore) return 100;    // score exists — show complete
        return 0;                                 // nothing yet — show empty
    };

    return {
        currentResume,
        score:            isActive ? null : (scoreData?.totalScore ?? null),
        jobProgress: getJobProgress(),
        secondsRemaining,
        loading:          resumesLoading || scoreLoading,
        error:            resumesError || scoreError,
        messages: {
            grade:          scoreData?.grade,
            overallMessage: isActive
                ? socketMessage
                : (scoreData?.overallMessage ?? null),
        },
        hasResume:    !!currentResume,
        totalResumes: resumes?.length ?? 0,
        isQueued:     isActive,
    };
};