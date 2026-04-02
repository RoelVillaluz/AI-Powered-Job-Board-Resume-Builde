import { createContext, useContext } from "react";
import type { StepKey } from "../../../constants/steps";
import type { CREATE_JOB_STEPS } from "../../../constants/steps";

type Step = (typeof CREATE_JOB_STEPS)[number];

type StepContextValue = {
  currentStepIndex: number;
  currentStep: Step;
  steps: typeof CREATE_JOB_STEPS;
  isNextAllowed: boolean;
  completedSteps: Set<StepKey>;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (key: StepKey) => void;
};

const StepContext = createContext<StepContextValue | null>(null);

export const StepProvider = StepContext.Provider;

/**
 * useStepContext
 * ---------------
 * Reads navigation state from the nearest `StepProvider`.
 * Use in `StepsContainer`, `FormContent`, or any component that needs
 * to know about step position or navigation — without touching form data.
 *
 * @throws If called outside of a `StepProvider`
 */
export function useStepContext(): StepContextValue {
  const ctx = useContext(StepContext);
  if (!ctx) throw new Error("useStepContext must be used within a StepProvider");
  return ctx;
}