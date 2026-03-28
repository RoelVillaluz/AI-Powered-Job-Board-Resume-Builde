import { useEffect, useState } from "react";
import { useJobForm } from "../../contexts/JobPostingFormContext";
import { CREATE_JOB_STEPS } from "../../../constants/steps";

/**
 * useStepNavigation
 * ------------------
 * Manages the current step index and computes whether the user
 * is allowed to advance, based on `formData` from `JobFormContext`.
 *
 * Validation rules per step:
 * - `details`               — title, location, jobType, and a valid salary range
 * - `skillsAndRequirements` — ≥3 skills and ≥3 requirement entries
 * - `questions`             — optional; always allowed
 * - `finished`              — always allowed
 */
export const useStepNavigation = () => {
  const { formData } = useJobForm();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isNextAllowed, setIsNextAllowed] = useState(false);

  const steps = CREATE_JOB_STEPS;
  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    if (!currentStep) {
      setIsNextAllowed(false);
      return;
    }

    switch (currentStep.key) {
      case "details": {
        const { title, location, jobType, salary } = formData;
        const isValid =
          title?.toString().trim() !== "" &&
          location?.toString().trim() !== "" &&
          jobType?.toString().trim() !== "" &&
          salary.min !== null &&
          salary.max !== null &&
          salary.min < salary.max &&
          salary.frequency.trim() !== "";

        setIsNextAllowed(isValid);
        break;
      }

      case "skillsAndRequirements": {
        const hasSkills = formData.skills.length >= 3;
        const requirementsCount =
          (formData.requirements.description ? 1 : 0) +
          (formData.requirements.certifications?.length ?? 0);

        setIsNextAllowed(hasSkills && requirementsCount >= 3);
        break;
      }

      case "questions":
        // Pre-screening questions are optional
        setIsNextAllowed(true);
        break; // ← was missing; previously fell through to "finished"

      case "finished":
        setIsNextAllowed(true);
        break;

      default:
        setIsNextAllowed(false);
        break;
    }
  }, [currentStepIndex, formData, currentStep]);

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return { currentStepIndex, isNextAllowed, nextStep, prevStep, steps };
};