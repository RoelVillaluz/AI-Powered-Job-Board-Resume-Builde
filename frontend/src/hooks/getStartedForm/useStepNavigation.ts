import { useEffect, useState } from "react";
import { StepConfig, GetStartedFormData } from "../../../types/forms/getStartedForm.types";
import { EMPLOYER_STEPS, JOBSEEKER_STEPS } from "../../../constants/steps";
import axios from "axios";
import { BASE_API_URL } from "../../config/api";
import { useAuthStore } from "../../stores/authStore";

export const useStepNavigation = (
    selectedRole: "jobseeker" | "employer" | null,
    formData: GetStartedFormData | null
) => {
    const { user, setUser } = useAuthStore();
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
    const [isNextAllowed, setIsNextAllowed] = useState<boolean>(false);

    // pick steps based on role
    const steps: StepConfig[] =
        selectedRole === "jobseeker"
            ? JOBSEEKER_STEPS
            : selectedRole === "employer"
            ? EMPLOYER_STEPS
            : [];

    const currentStep = steps[currentStepIndex];

    // run validation whenever step changes or formData changes
    useEffect(() => {
        if (!formData || !currentStep) {
            setIsNextAllowed(false);
            return;
        }

        // Type guard to narrow formData to the step's role
        if (formData.role === currentStep.role && currentStep.validate) {
            if (currentStep.role === 'jobseeker' && formData.role === 'jobseeker') {
                setIsNextAllowed(currentStep.validate(formData));
            } else if (currentStep.role === 'employer' && formData.role === 'employer') {
                setIsNextAllowed(currentStep.validate(formData));
            } else {
                setIsNextAllowed(false);
            }
        } else if (!currentStep.validate) {
            setIsNextAllowed(true);
        } else {
            setIsNextAllowed(false);
        }
    }, [currentStepIndex, formData, currentStep]);

    // Add active class to step markers in the DOM
    useEffect(() => {
        const stepMarkers = document.querySelectorAll(".steps li");
        stepMarkers.forEach((marker, index) => {
            marker.setAttribute("data-index", index.toString());
            if (currentStepIndex >= index) {
                marker.classList.add("active");
            } else {
                marker.classList.remove("active");
            }
        });
    }, [currentStepIndex]);

    const nextStep = async () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex((prev) => prev + 1);
            setIsNextAllowed(false);

            // Update user role on the server after first step
            if (selectedRole && user) {
                try {
                    const response = await axios.patch(
                        `${BASE_API_URL}/users/${user.id || user._id}`,
                        { role: selectedRole }
                    );
                    setUser(response.data);
                } catch (error) {
                    console.error("Failed to update role:", error);
                }
            }
        }
    };

    const prevStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex((prev) => prev - 1);
            setIsNextAllowed(true);
        }
    };

    return { currentStepIndex, isNextAllowed, nextStep, prevStep, steps };
};