import { useMemo } from "react";

/**
 * Extract all unique skills from resumes
 */
export const useResumeSkills = (resumes) => {
    const allResumeSkills = useMemo(() => {
        if (!Array.isArray(resumes)) return [];

        const skills = resumes
            .flatMap(resume =>
                Array.isArray(resume.skills)
                    ? resume.skills.map(skill => skill.name)
                    : []
            );

        return [...new Set(skills)];
    }, [resumes]);

    return allResumeSkills;
};