import { useState } from "react";
import axios from "axios";
import { BASE_API_URL } from "../../config/api";
import { UserRole, GetStartedFormData } from "../../../types/forms/getStartedForm.types";
import { useAuthStore } from "../../stores/authStore";
import { createResumeService } from "../../services/resumeServices";
import { updateUserService } from "../../services/userServices";
import { createCompanyService } from "../../services/companyServices"

type useGetStartedFormSubmissionParams = {
    formData: GetStartedFormData,
    selectedRole: UserRole | undefined,
    user: any,
    navigate: (path: string) => void;
}

export const useGetStartedFormSubmission = ({
    formData,
    selectedRole,
    user,
    navigate,
}: useGetStartedFormSubmissionParams) => {
    const token = useAuthStore(state => state.token); 
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFormSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        if (!selectedRole) {
            setError("You must select a role first.");
            return;
        }

        if (!token) {
            setError("Authentication required.");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // ✅ Jobseeker flow
            if (formData.role === "jobseeker") {
                await createResumeService({
                    ...formData.data,
                    user: user.id || user._id,
                });

                navigate("/");
                return;
            }

            // ✅ Employer flow
            if (formData.role === "employer") {
                const company = await createCompanyService(
                    {
                        ...formData.data,
                        user: user.id || user._id,
                    },
                    token
                );

                await updateUserService(user.id || user._id, {
                    company: company._id,
                });

                navigate("/");
            }
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return {
        handleFormSubmit,
        error,
        isLoading,
    };
};