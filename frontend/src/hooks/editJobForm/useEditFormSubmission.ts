import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useState } from "react";
import { useEditJobForm } from "../../contexts/JobFormContexts/EditJobFormContext";
import axios from "axios";
import { BASE_API_URL } from "../../config/api";
import { useQueryClient } from "@tanstack/react-query";

export const useEditFormSubmission = (jobId: string) => {
    const { formData } = useEditJobForm();
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);

    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();

    const queryClient = useQueryClient();

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            setError("You must be logged in to post a job.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await axios.patch(
                `${BASE_API_URL}/job-postings/${jobId}`,
                formData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            queryClient.invalidateQueries({ queryKey: ['jobPosting', jobId] });

            if (jobId) {
                navigate(`/job-postings/${jobId}`);
            } else {
                setError("Job posting edit failed, please try again.");
            }
        } catch (err: any) {
            const message = err.response?.data?.message;
            setError(message ?? "Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return { error, isSubmitting, handleFormSubmit }
}