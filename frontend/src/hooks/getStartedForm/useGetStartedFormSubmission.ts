// useGetStartedFormSubmission.ts
import { useState } from "react";
import axios from "axios";
import type { GetStartedFormData, UserRole } from "../../../types/forms/getStartedForm.types";
import { BASE_API_URL } from "../../config/api";
import { useAuthStore } from "../../stores/authStore";

interface UseGetStartedFormSubmissionProps {
    formData: GetStartedFormData | null;
    selectedRole: UserRole;
    user: any;
    navigate: any;
}

export const useGetStartedFormSubmission = ({ 
    formData, 
    selectedRole, 
    user, 
    navigate 
}: UseGetStartedFormSubmissionProps) => {
    const token = useAuthStore((state) => state.token);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Guard clause - don't submit if no formData or role
                if (!formData || !selectedRole) {
                    setError("Please complete all required steps");
                    return;
                }

           //  Guard clause - ensure user exists
            if (!user || !user._id) {
                setError("User session not found. Please log in again.");
                return;
            }

            setIsLoading(true);
            setError(null);

            const response = await axios.post(`${BASE_API_URL}/users/${user._id}/onboarding`, {
                role: selectedRole,
                data: formData
            }, { headers: { Authorization: `Bearer ${token}` }})

            navigate(`/dashboard/${selectedRole}`);

            return response.data.data;
        } catch (error: any) {
            if (error.response) {
                setError(error.response.message || 'Onboarding failed')
            } else {
                setError("Network error. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    }

    return { handleFormSubmit, error, isLoading };
};