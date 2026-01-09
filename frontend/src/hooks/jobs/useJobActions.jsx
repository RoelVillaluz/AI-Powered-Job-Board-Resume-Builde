import { useAuthStore } from "../../stores/authStore";
import axios from "axios";
import { BASE_API_URL } from "../../config/api";

export const useJobActions = () => {
    const user = useAuthStore(state => state.user);
    const token = useAuthStore(state => state.token);
    const refreshUser = useAuthStore(state => state.refreshUser);

    const handleJobAction = async (e, jobId, resume, actionType, hasQuestions = false, answers = null, isApplied = false) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            if (!user) {
                console.error("User not authenticated");
                return;
            }

            if (!token) {
                console.log('Token not found');
                return;
            }

            // Only show modal if user is applying for the first time and there are questions
            if (actionType === 'apply' && hasQuestions && !answers && !isApplied) {
                showModal(); 
                return;
            }

            const endpoints = {
                save: `${BASE_API_URL}/users/save-job/${jobId}`,
                apply: `${BASE_API_URL}/users/apply-to-job/${jobId}`,
            }
            
            if (!endpoints[actionType]) {
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

            // Refresh user data from the server to get updated savedJobs/appliedJobs
            await refreshUser();

        } catch (error) {
            console.error('Error', error);
        }
    };


    const toggleSaveJob = (e, jobId) => handleJobAction(e, jobId, null, "save");
    
    const toggleApplyJob = (e, jobId, resume, hasQuestions, answers = null) => {
        const isApplied = user?.appliedJobs?.includes(jobId);
        handleJobAction(e, jobId, resume, "apply", hasQuestions, answers, isApplied);
    };

    return { toggleSaveJob, toggleApplyJob, handleJobAction };

}