import { useState } from "react";
import { useJobForm } from "../../contexts/JobPostingFormContext";
import { useFormValidation } from "./useFormValidation";
import { CREATE_JOB_STEPS } from "../../../constants/steps";

/**
 * useStepNavigation
 * ------------------
 * Manages the current step index and exposes navigation controls.
 *
 * Validation logic is intentionally absent — it lives entirely in
 * `useFormValidation`. This hook only asks "is the current step valid?"
 * via `isValid`, which is always in sync with `formData` without needing
 * a `useEffect` to recompute it.
 *
 * ## nextStep behaviour
 * - If the step is valid: advances the index and resets `touched` so the
 *   next step opens without inherited error state.
 * - If the step is invalid: calls `touchAll()` to surface every unvisited
 *   error, then blocks — does not advance.
 *
 * ## Adding validation for a new step
 * Add a validator to `STEP_VALIDATORS` in `useFormValidation` — no changes
 * needed here.
 */
export const useStepNavigation = () => {
  const { formData, touched, setTouched } = useJobForm();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const steps = CREATE_JOB_STEPS;
  const currentStep = steps[currentStepIndex];

  const { isValid, touchAll } = useFormValidation(currentStep.key); // pass step key explicitly

  // Steps with no registered validator (questions, finished) return isValid=true
  // from useFormValidation, so they always allow advancing — no special casing needed.
  const isNextAllowed = isValid;

  const nextStep = () => {
    if (!isValid) {
      touchAll(); // surface all errors before blocking
      return;
    }
    setTouched(new Set()); // reset so next step opens clean
    setCurrentStepIndex((prev) =>
      prev < steps.length - 1 ? prev + 1 : prev
    );
  };

  const prevStep = () => {
    setTouched(new Set()); // reset so previous step also opens clean
    setCurrentStepIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  return { currentStepIndex, isNextAllowed, nextStep, prevStep, steps, currentStep };
};