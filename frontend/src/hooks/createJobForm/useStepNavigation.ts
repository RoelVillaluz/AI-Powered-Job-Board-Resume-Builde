import { useState } from "react";
import { useJobForm } from "../../contexts/JobFormContexts/JobPostingFormContext";
import { useFormValidation } from "./useFormValidation";
import { useDraftPersistence } from "../useDraftPersistence";
import { useDraftStore } from "../../stores/draftStore";
import { CREATE_JOB_STEPS } from "../../../constants/steps";
import type { StepKey } from "../../../constants/steps";

export const STEP_DRAFT_KEY = "create-job-form-steps";

type StepDraft = {
  stepIndex: number;
  completedSteps: StepKey[];
};

/**
 * Reads saved step state synchronously before the first render.
 * Same pattern as `readDraftSync` in `useCreateJobFormData` — ensures
 * `useState` is seeded with the correct step index immediately so the
 * user lands on their last step on reload rather than always step 0.
 */
function readStepDraftSync(): StepDraft | null {
  try {
    const draft = useDraftStore.getState().loadDraft(STEP_DRAFT_KEY) as StepDraft | null;
    return draft ?? null;
  } catch {
    return null;
  }
}

/**
 * useStepNavigation
 * ------------------
 * Called ONCE in `StepShell` and placed into `StepProvider`.
 * Components must NOT call this hook directly — use `useStepContext()`.
 *
 * ## Synchronous step restore
 * `currentStepIndex` and `completedSteps` are seeded from the step draft
 * store synchronously so the user lands on the correct step immediately
 * on reload — no flash of step 0.
 */
export const useStepNavigation = () => {
  const { setTouched } = useJobForm();

  const savedSteps = readStepDraftSync();

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(
    savedSteps?.stepIndex ?? 0
  );
  const [completedSteps, setCompletedSteps] = useState<Set<StepKey>>(
    new Set(savedSteps?.completedSteps ?? [])
  );

  const steps = CREATE_JOB_STEPS;
  const currentStep = steps[currentStepIndex];

  const { isValid, touchAll } = useFormValidation(currentStep.key);

  // Persist step state independently from form data
  useDraftPersistence<StepDraft>({
    key: STEP_DRAFT_KEY,
    data: {
      stepIndex: currentStepIndex,
      completedSteps: [...completedSteps],
    },
    onRestore: () => {
      // No-op — we already restored synchronously above.
      // This callback would only fire if the store updated externally
      // (e.g. another tab), which we don't need to handle here.
    },
    debounceMs: 300, // steps change less frequently, shorter debounce is fine
  });

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