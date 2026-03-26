import { useEffect, useState } from "react";
import { CREATE_JOB_STEPS } from "../../../constants/steps";
import type { CreateJobFormData } from "../../../types/forms/createJobForm.types";

export const useStepNavigation = (
    formData: CreateJobFormData
) => {
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
    const [isNextAllowed, setIsNextAllowed] = useState<boolean>(false);

    const steps = CREATE_JOB_STEPS
    const currentStep = steps[currentStepIndex];

    useEffect(() => {
        if (!currentStep) {
        setIsNextAllowed(false);
        return;
        }

        switch (currentStep.key) {
        case "details": {
            const requiredFields: (keyof CreateJobFormData)[] = [
                "title",
                "location",
                "jobType",
                "salary",
            ];

            const isValid = requiredFields.every((field) => {
                const value = formData[field];

                if (field === "salary") {
                    // TypeScript now knows value is formData.salary
                    const salaryValue = formData.salary; // safe
                    return (
                    salaryValue.salary.min !== null &&
                    salaryValue.salary.max !== null &&
                    salaryValue.frequency.trim() !== ""
                    );
                }

                return value?.toString().trim() !== "";
            });

            setIsNextAllowed(isValid);
            break;
        }

        case "skillsAndRequirements": {
            // Minimum 3 skills
            const hasSkills = formData.skills.length >= 3;

            // Minimum 3 requirements (using description + optional array items)
            const requirementsCount =
            (formData.requirements.description ? 1 : 0) +
            (formData.requirements.certifications?.length ?? 0);
            const hasRequirements = requirementsCount >= 3;

            setIsNextAllowed(hasSkills && hasRequirements);
            break;
        }

        case "questions": {
            // Pre-screening questions are only optional
            const hasQuestions = (formData.preScreeningQuestions?.length ?? 0) > 0;
            setIsNextAllowed(true);
        }

        case "finished": {
            // Final step is always allowed
            setIsNextAllowed(true);
            break;
        }

        default:
            setIsNextAllowed(false);
            break;
        }
    }, [currentStepIndex, formData, currentStep]);

    const nextStep = async () => {
        if (currentStepIndex < CREATE_JOB_STEPS.length - 1) {
            setCurrentStepIndex((prev) => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex((prev) => prev - 1);
        }
    };

 
    return { currentStepIndex, isNextAllowed, nextStep, prevStep, steps };
}