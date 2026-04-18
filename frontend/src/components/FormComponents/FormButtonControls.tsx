import type { CreateJobSteps } from "../../../constants/steps";

type FormButtonControlsProps = {
  currentStepIndex: number;
  currentStep: CreateJobSteps;
  nextStep: () => void;
  prevStep: () => void;
  isSubmitting: boolean;
  isNextAllowed: boolean;
  hasDraft: boolean;
  discardDraft: () => void;
};

/**
 * FormButtonControls
 * -------------------
 * Renders the bottom control bar for the multi-step form:
 * - Draft restored banner with a discard button (step 0 only, when a draft exists)
 * - Previous button (all steps after step 0)
 * - Next button (all steps except finished, when the step is valid)
 * - Submit button (finished step only)
 */
export const FormButtonControls = ({
  currentStepIndex,
  currentStep,
  prevStep,
  nextStep,
  isSubmitting,
  isNextAllowed,
  hasDraft,
  discardDraft,
}: FormButtonControlsProps) => {
  return (
    <>
      {/* Draft banner — only on step 0 so it doesn't re-appear on every step */}
      {hasDraft && currentStepIndex === 0 && (
        <div className="draft-banner" role="status">
          <span>Draft restored — pick up where you left off.</span>
          <button
            type="button"
            className="draft-banner__discard"
            onClick={discardDraft}
          >
            Discard draft
          </button>
        </div>
      )}

      <div
        className="buttons"
        style={{ justifyContent: currentStepIndex > 0 ? "space-between" : "flex-end" }}
      >
        {currentStepIndex > 0 && (
          <button onClick={prevStep} id="prev-step-btn" type="button">
            Previous
          </button>
        )}

        {currentStep.key === "finished" ? (
          <button id="submit-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="spinner m-auto"></div>
            ) : (
              'Submit'
            )}
          </button>
        ) : (
          isNextAllowed && (
            <button
              id="next-step-btn"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                nextStep();
              }}
            >
              Next
            </button>
          )
        )}
      </div>
    </>
  );
};