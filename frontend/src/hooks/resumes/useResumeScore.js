import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "../../contexts/SocketContext";
import { useAuthStore } from "../../stores/authStore";
import { useResumeStore } from "../../stores/resumeStore";
import { useResumeScoreQuery, useUserResumesQuery } from "./useResumeQueries";
import {
    fetchResumeEmbeddingsV2,
    fetchResumeScoreV2,
} from "../../../api/resumeApis";

import {
    generateResumeEmbeddingsV2,
    generateResumeScoreV2,
} from "../../services/resumeServices"

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
    const pipelineStartTime = useRef(null);

    const resumeId = currentResume?._id;

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

    // ── 3. POST score (embeddings exist, score missing) ───────────────────────
    const { mutate: generateScore } = useMutation({
        mutationFn: () => generateResumeScoreV2(resumeId, token),
        onSuccess: (data) => {
            if (data?.status === 'embeddings_required') {
                // shouldn't happen here but guard anyway
                generateEmbeddings();
                return;
            }
            setIsQueued(true);
            setSocketMessage("Calculating your score...");
        },
        onError: (err) => setSocketMessage(err.message),
    });

    // ── 4. POST embeddings (embeddings missing) ───────────────────────────────
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

        if (scoreData) return; // score exists — nothing to do

        if (!embeddingsFetched) return; // waiting for embeddings query

        if (embeddingsData) {
            // embeddings exist but no score — POST score
            generateScore();
        } else {
            // no embeddings — POST embeddings
            // afterSave will trigger scoring automatically
            generateEmbeddings();
        }
    }, [scoreFetched, embeddingsFetched, scoreData, embeddingsData, resumeId]);

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
            setIsQueued(false);
            setSocketProgress(100);
            setSocketMessage("Your resume score is ready!");
            setSecondsRemaining(null);
            pipelineStartTime.current = null;
            queryClient.setQueryData(["resumeScore", resumeId], {
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
    }, [socket, resumeId]);

    const isActive = isQueued || socketProgress > 0 && socketProgress < 100;

    return {
        currentResume,
        score:            isActive ? null : (scoreData?.data?.totalScore ?? null),
        jobProgress:      isActive ? socketProgress : 100,
        secondsRemaining,
        loading:          resumesLoading || scoreLoading,
        error:            resumesError || scoreError,
        messages: {
            grade:          scoreData?.data?.grade,
            overallMessage: isActive
                ? socketMessage
                : (scoreData?.data?.overallMessage ?? null),
        },
        hasResume:    !!currentResume,
        totalResumes: resumes?.length ?? 0,
        isQueued:     isActive,
    };
};