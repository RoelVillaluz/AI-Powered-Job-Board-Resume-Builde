import { useState, useEffect } from "react";

export const useResumes = (baseUrl, jobId, user) => {
    const [resumes, setResumes] = useState([]);
    const [currentResume, setCurrentResume] = useState(null);
    const [resumeScore, setResumeScore] = useState({
        skillSimilarity: 0,
        experienceSimilarity: 0,
        requirementsSimilarity: 0,
        totalScore: 0
    })

    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const response = await axios.get(`${baseUrl}/resumes/user/${user?._id}`)
                console.log('User Resumes: ', response.data.data)

                setResumes(response.data.data)
                if (response.data.data.length > 0) {
                    setCurrentResume(response.data.data[0]);
                }
            } catch (error) {
                console.error('Error: ', error)
            }
        }
        fetchResumes()
    }, [user?._id])

    const handleAddSkillToResume = async (resumeId, newSkill) => {
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
    }
}