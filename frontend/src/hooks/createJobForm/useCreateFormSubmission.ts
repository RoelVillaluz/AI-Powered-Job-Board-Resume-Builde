import { useState } from "react";
import axios from "axios";
import { useAuthStore } from "../../stores/authStore";
import { useJobForm } from "../../contexts/JobFormContexts/JobPostingFormContext";
import { BASE_API_URL } from "../../config/api";
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from "uuid";

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
  const user = useAuthStore((state) => state.user);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey] = useState(() => uuidv4());

  const navigate = useNavigate();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError("You must be logged in to post a job.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        jobPostingData: {
          ...formData,
          company: user.company._id ?? user.company
        },
        idempotencyKey
      };

      console.log("Form Payload:", payload);

      const response = await axios.post(
        `${BASE_API_URL}/job-postings`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log("API Response:", response.data);

      // Ensure we are getting the correct ID for redirection
      const jobId = response.data.data._id;
      if (jobId) {
        navigate(`/job-postings/${jobId}`);
      } else {
        setError("Job posting failed, please try again.");
      }

    } catch (err: any) {
      const message = err.response?.data?.message;
      setError(message ?? "Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { error, isSubmitting, handleFormSubmit };
};