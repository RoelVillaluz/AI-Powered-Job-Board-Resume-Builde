import { useAuth } from "../../contexts/AuthProvider";
import axios from "axios";

export const useJobActions = () => {
    const { user, setUser } = useAuth();

    const handleJobAction = async (e, jobId, resume, actionType, hasQuestions = false, answers = null, isApplied = false) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            if (!user) {
                console.error("User not authenticated");
                return;
            }

            const token = localStorage.getItem("authToken")
            if (!token) {
                console.log('Token not found')
                return;
            }

            // Only show modal if user is applying for the first time and there are questions
            if (actionType === 'apply' && hasQuestions && !answers && !isApplied) {
                showModal(); 
                return;
            }

            const endpoints = {
                save: `http://localhost:5000/api/users/save-job/${jobId}`,
                apply: `http://localhost:5000/api/users/apply-to-job/${jobId}`,
            }
            
            const userStateKeys = {
                save: "savedJobs",
                apply: "appliedJobs"
            }

            if (!endpoints[actionType] || !userStateKeys[actionType]) {
                console.error("Invalid action type");
                return;
            }

            const payload = {
                applicant: String(user._id),
                resume: resume,
            };

            if (answers) {
                payload.answers = answers;
            }

            const response = await axios.post(
                endpoints[actionType],
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log(response.data);

            setUser((prevUser) => ({
                ...prevUser,
                [userStateKeys[actionType]]: prevUser[userStateKeys[actionType]].includes(jobId)
                    ? prevUser[userStateKeys[actionType]].filter((id) => id !== jobId) // Unapply/Unsave
                    : [...prevUser[userStateKeys[actionType]], jobId] // Apply/Save
            }));

        } catch (error) {
            console.error('Error', error);
        }
    };


    const toggleSaveJob = (e, jobId) => handleJobAction(e, jobId, null, "save")
    const toggleApplyJob = (e, jobId, resume, hasQuestions, answers = null) => {
        const isApplied = user.appliedJobs.includes(jobId);
        handleJobAction(e, jobId, resume, "apply", hasQuestions, answers, isApplied);
    };

    return { toggleSaveJob, toggleApplyJob, handleJobAction };

}