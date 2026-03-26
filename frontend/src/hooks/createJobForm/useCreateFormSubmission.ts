import { useState } from "react";
import type { CreateJobFormData } from "../../../types/forms/createJobForm.types";
import { useAuthStore } from "../../stores/authStore";
import axios from "axios";
import { BASE_API_URL } from "../../config/api";

export const useCreateJobFormSubmission = (
    formData: CreateJobFormData
) => {
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (!formData || !user?.company) {
                setError("User company information is missing.");
                return;
            }

            setIsLoading(true);
            setError(null);

            const payload = {
                ...formData
            };

            const response = await axios.post(
                `${BASE_API_URL}/job-postings`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            return response.data.data;
        } catch (error: any) {
            if (error.response) {
                setError(error.response.data?.message || 'Job posting creation failed');
            } else {
                setError("Network error. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return { error, isLoading, handleFormSubmit };
};