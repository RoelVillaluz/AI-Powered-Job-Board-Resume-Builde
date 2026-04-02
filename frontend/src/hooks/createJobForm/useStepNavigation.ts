import { useState } from "react";
import { useJobForm } from "../../contexts/JobFormContexts/JobPostingFormContext";
import { useFormValidation } from "./useFormValidation";
import { CREATE_JOB_STEPS } from "../../../constants/steps";
import type { StepKey } from "../../../constants/steps";

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
  const { touched, setTouched } = useJobForm();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<StepKey>>(new Set());
 
  const steps = CREATE_JOB_STEPS;
  const currentStep = steps[currentStepIndex];
 
  const { isValid, touchAll } = useFormValidation(currentStep.key);
 
  const isNextAllowed = isValid;
 
  const nextStep = () => {
    if (!isValid) {
      touchAll();
      return;
    }
    setTouched(new Set());
    setCompletedSteps((prev) => new Set(prev).add(currentStep.key as StepKey));
    setCurrentStepIndex((prev) =>
      prev < steps.length - 1 ? prev + 1 : prev
    );
  };
 
  const prevStep = () => {
    setTouched(new Set());
    setCurrentStepIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };
 
  const goToStep = (key: StepKey) => {
    const index = steps.findIndex((s) => s.key === key);
    if (index === -1 || !completedSteps.has(key)) return;
    setTouched(new Set());
    setCurrentStepIndex(index);
  };
 
  return {
    currentStepIndex,
    currentStep,
    steps,
    isNextAllowed,
    completedSteps,
    nextStep,
    prevStep,
    goToStep,
  };
};