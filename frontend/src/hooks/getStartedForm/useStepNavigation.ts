import { useEffect, useState } from "react";
import type {
    StepConfig,
    GetStartedFormData,
    UserRole,
    JobseekerFormData,
    EmployerFormData,
} from "../../../types/forms/getStartedForm.types";
import {
    EMPLOYER_STEPS,
    JOBSEEKER_STEPS,
    ROLE_SELECTION_STEP,
} from "../../../constants/steps";
import axios from "axios";
import { BASE_API_URL } from "../../config/api";
import { useAuthStore } from "../../stores/authStore";

export const useStepNavigation = (
    selectedRole: UserRole,
    formData: GetStartedFormData | null,
    user: any
) => {
    const setUser = useAuthStore((state) => state.setUser);
    const token = useAuthStore((state) => state.token);
    
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
    const [isNextAllowed, setIsNextAllowed] = useState<boolean>(false);

    // Pick steps based on role
    const steps: StepConfig[] =
        selectedRole === "jobseeker"
            ? JOBSEEKER_STEPS
            : selectedRole === "employer"
            ? EMPLOYER_STEPS
            : [ROLE_SELECTION_STEP]; // Show only role selection step if no role selected

    const currentStep = steps[currentStepIndex];

    // Validation logic
    useEffect(() => {
        if (!currentStep) {
            setIsNextAllowed(false);
            return;
        }

        // Step 0: Role selection - just check if role is selected
        if (currentStep.key === "role") {
            setIsNextAllowed(selectedRole !== null);
            return;
        }

        // For other steps, validate based on formData
        if (!formData) {
            setIsNextAllowed(false);
            return;
        }

        // Validate based on step key
        switch (currentStep.key) {
            case "details":
                if (formData.role === "jobseeker") {
                    const data = formData.data as JobseekerFormData;
                    const requiredFields = ["firstName", "lastName", "phone", "address", "summary"];
                    setIsNextAllowed(
                        requiredFields.every(
                            (field) =>
                                data[field as keyof JobseekerFormData]?.toString().trim() !== ""
                        )
                    );
                } else if (formData.role === "employer") {
                    const data = formData.data as EmployerFormData;
                    const requiredFields = ["name", "location", "description"];
                    setIsNextAllowed(
                        requiredFields.every(
                            (field) =>
                                data[field as keyof EmployerFormData]?.toString().trim() !== ""
                        )
                    );
                }
                break;

            case "skills":
                if (formData.role === "jobseeker") {
                    const data = formData.data as JobseekerFormData;
                    setIsNextAllowed((data.skills?.length ?? 0) >= 3);
                }
                break;

            case "industry":
                if (formData.role === "employer") {
                    const data = formData.data as EmployerFormData;
                    setIsNextAllowed((data.industry?.length ?? 0) > 0);
                }
                break;

            // Steps that don't require validation
            case "workExperience":
            case "resume":
            case "finished":
                setIsNextAllowed(true);
                break;

            default:
                setIsNextAllowed(false);
        }
    }, [currentStepIndex, formData, currentStep, selectedRole]);

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

            // Update user role on the server after role selection (step 0)
            // if (currentStepIndex === 0 && selectedRole && user) {
            //     try {
            //         const userId = user.id || user._id;
            //         const response = await axios.patch(
            //             `${BASE_API_URL}/users/${userId}`,
            //             { role: selectedRole },
            //             {
            //                 headers: {
            //                     Authorization: `Bearer ${token}`
            //                 }
            //             }
            //         );
            //         setUser(response.data);
            //     } catch (error) {
            //         console.error("Failed to update role:", error);
            //     }
            // }
        }
    };

    const prevStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex((prev) => prev - 1);

            // If going back to the role selection step, revert to the original user state
            if (currentStepIndex === 1) {
                setUser(user); // Revert to original user
            }
        }
    };

    return { currentStepIndex, isNextAllowed, nextStep, prevStep, steps };
};
