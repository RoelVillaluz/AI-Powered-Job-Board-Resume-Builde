import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { useAuthStore } from "../../stores/authStore";
import { useResumeStore } from "../../stores/resumeStore";
import { updateResumeService } from "../../services/resumeServices";
import type { Resume, Skill } from "../../../types/models/resume";
import { generateResumeJobMatches } from "../../services/resumeServices";
import { useSocket } from "../../contexts/SocketContext";
import { useEffect } from "react";

interface ToggleSkillVariables {
    resume?: Resume;
    skill: Skill;
}

interface ToggleSkillContext {
    previousResume?: Resume;
}

export const useToggleSkill = () => {
    const queryClient = useQueryClient();
    const { token } = useAuthStore();
    const currentResume = useResumeStore(state => state.currentResume);

    return useMutation<Resume, unknown, ToggleSkillVariables, ToggleSkillContext>({
        mutationFn: async ({ resume = currentResume, skill }) => {
            if (!resume) throw new Error("No resume found");

            const skillExists = resume.skills.some((s: Skill) => s._id === skill._id);
            const updatedSkills: Skill[] = skillExists
                ? resume.skills.filter((s: Skill) => s._id !== skill._id)
                : [...resume.skills, skill];

            return updateResumeService(resume._id, { skills: updatedSkills }, token);
        },

        onMutate: async ({ resume = currentResume, skill }) => {
            if (!resume) return { previousResume: undefined };

            const skillExists = resume.skills.some((s: Skill) => s._id === skill._id);
            const optimisticResume: Resume = {
                ...resume,
                skills: skillExists
                ? resume.skills.filter((s: Skill) => s._id !== skill._id)
                : [...resume.skills, skill],
            };

            useResumeStore.getState().setCurrentResume(optimisticResume);

            return { previousResume: resume };
        },

        onError: (err, variables, context) => {
            if (context?.previousResume) {
                useResumeStore.getState().setCurrentResume(context.previousResume);
            }
        },

        onSuccess: (updatedResume) => {
            useResumeStore.getState().setCurrentResume(updatedResume);

            // Invalidate queries safely
            queryClient.invalidateQueries({ queryKey: ['resumes'] }); // list
            queryClient.invalidateQueries({ queryKey: ['resume', updatedResume._id] }); // single resume
        },
    });
};

/**
 * Triggers resume-job match generation via POST.
 * Called automatically when GET returns 404 (no matches yet)
 * or manually when user requests fresh matches.
 *
 * On success: listens for "matching:complete" socket event
 * emitted by the BullMQ worker when the pipeline finishes.
 * Invalidates the match query on completion so GET re-fetches
 * the fresh results — no arbitrary setTimeout needed.
 */
export const useResumeJobMatchMutation = (resumeId: string, token: string) => {
    const queryClient = useQueryClient();
    const socketContext = useSocket();
    const socket = (useSocket() as any)?.socket ?? null;

    const mutation = useMutation({
        mutationFn: () => generateResumeJobMatches(resumeId, token),
        onError: (err) => {
            console.error('[useResumeJobMatchMutation] Failed to trigger match generation:', err);
        },
    });

    useEffect(() => {
        if (!socket || !resumeId || !mutation.isPending) return;

        const handleMatchingComplete = ({ data }: { data: any }) => {
            if (data?.resume?.toString() === resumeId) {
                queryClient.setQueryData(['resumeJobMatch', resumeId], data);
            }
        };

        const handleMatchingError = ({ message }: { message: string }) => {
            console.error('[useResumeJobMatchMutation] Worker error:', message);
        };

        socket.on('matching:complete', handleMatchingComplete);
        socket.on('matching:error',    handleMatchingError);

        return () => {
            socket.off('matching:complete', handleMatchingComplete);
            socket.off('matching:error',    handleMatchingError);
        };
    }, [socket, resumeId, mutation.isPending, queryClient]);

    return mutation;
};