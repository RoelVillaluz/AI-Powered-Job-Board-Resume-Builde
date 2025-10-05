import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export const useResumeActions = (baseUrl, user, setUser, setCurrentResume) => {

    const handleAddSkillToResume = useCallback(async (resumeId, newSkill) => {
        const currentResume = user.resumes.find(resume => resume._id === resumeId)
        if (!currentResume) return;

         // Check if skill is already in the resume
        const skillExists = currentResume.skills.some(s => s._id === newSkill._id)

        // Add or remove skill based on current status
        const updatedSkills = skillExists 
            ? currentResume.skills.filter(s => s._id !== newSkill._id)
            : [...currentResume.skills, newSkill]

        try {
            const response = await axios.patch(`${baseUrl}/resumes/${resumeId}`, {
                skills: updatedSkills
            })

            // update local user state with updated resume
            const updatedResume = response.data.data;

            // Update the currentResume state immediately
            if (currentResume._id === resumeId) {
                setCurrentResume(updatedResume);
            }

            const updatedResumes = user.resumes.map(resume => resume._id === resumeId ? updatedResume : resume);

            setUser(prev => ({
                ...prev,
                resumes: updatedResumes
            }));

            console.log("Resume Skills: :", response.data.data.skills)
        } catch (error) {
            console.error('Failed to add skill:', error);
        }
    }, [baseUrl, user, setUser, setCurrentResume]);

    return { handleAddSkillToResume }
}