import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateJobMatches } from "../../../api/jobApis";
import { useSocket } from "../../contexts/SocketContext"

export const useEnsureJobMatches = (resumeId, token, matchQuery) => {
    const queryClient = useQueryClient();
    const hasTriggeredRef = useRef(false);
    const { socket } = useSocket();

    const generateMutation = useMutation({
        mutationFn: () => generateJobMatches(resumeId, token),
    });

    const noMatchesYet =
        matchQuery.isFetched &&
        !matchQuery.isLoading &&
        (!matchQuery.data || matchQuery.data.matches?.length === 0);

    useEffect(() => {
        hasTriggeredRef.current = false;
    }, [resumeId]);

    useEffect(() => {
        if (!resumeId || !token || !noMatchesYet || hasTriggeredRef.current) return;

        hasTriggeredRef.current = true;
        generateMutation.mutate();
    }, [resumeId, token, noMatchesYet]);

    useEffect(() => {
        if (!resumeId || !socket) return;

        const handleComplete = ({ data }) => {
            if (!data || data.resume?.toString() !== resumeId.toString()) return;

            // Was invalidating ['resumeJobMatch', resumeId] — nothing in
            // TopJobSection reads that key. useJobRecommendations (which
            // TopJobSection actually calls) is keyed ['jobRecommendations',
            // resumeId], so that's what needs invalidating for the UI to
            // actually pick up the fresh matches.
            queryClient.invalidateQueries({ queryKey: ['jobRecommendations', resumeId] });
        };

        socket.on('matching:complete', handleComplete);
        return () => socket.off('matching:complete', handleComplete);
    }, [resumeId, socket, queryClient]);

    return {
        isGenerating: generateMutation.isPending || (noMatchesYet && !generateMutation.isError),
        generationError: generateMutation.error,
    };
};