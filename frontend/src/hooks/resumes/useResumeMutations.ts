import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { useAuthStore } from "../../stores/authStore";
import { useResumeStore } from "../../stores/resumeStore";
import { updateResumeService } from "../../services/resumeServices";
import type { Resume, Skill } from "../../../types/resume";

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