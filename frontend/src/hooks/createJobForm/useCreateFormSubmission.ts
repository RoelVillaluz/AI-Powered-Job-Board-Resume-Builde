import { useState } from "react";
import axios from "axios";
import { useAuthStore } from "../../stores/authStore";
import { useJobForm } from "../../contexts/JobFormContexts/JobPostingFormContext";
import { BASE_API_URL } from "../../config/api";

/**
 * useCreateJobFormSubmission
 * ---------------------------
 * Handles POST submission of the create-job form.
 * Reads `formData` from `JobFormContext` — no prop needed.
 *
 * Returns `error` for the parent to render, since the submission hook
 * doesn't own any UI.
 */
export const useCreateJobFormSubmission = () => {
  const { formData } = useJobForm();
  const token = useAuthStore((state) => state.token);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError("You must be logged in to post a job.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await axios.post(
        `${BASE_API_URL}/job-postings`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message;
      setError(message ?? "Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { error, isSubmitting, handleFormSubmit };
};