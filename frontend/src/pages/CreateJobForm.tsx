import { useEffect } from "react";
import Layout from "../components/Layout.jsx";
import { StepsContainer } from "../components/MultiStepForm/CreateJobForm/StepsContainer.js";
import { JobFormProvider } from "../contexts/JobFormContexts/JobPostingFormContext.js";
import { StepProvider } from "../contexts/JobFormContexts/StepContext.js";
import { useCreateJobFormData } from "../hooks/createJobForm/useCreateJobFormData.js";
import { useStepNavigation } from "../hooks/createJobForm/useStepNavigation.js";
import { useCreateJobFormSubmission } from "../hooks/createJobForm/useCreateFormSubmission.js";
import { useJobForm } from "../contexts/JobFormContexts/JobPostingFormContext.js";
import { useStepContext } from "../contexts/JobFormContexts/StepContext.js";
import { CREATE_JOB_INITIAL_FORM_DATA } from "../../constants/formSchemas.js";

/**
 * CreateJobForm
 * -------------
 * Sets up two independent providers:
 * - `JobFormProvider` — form data, handlers, draft, touched state
 * - `StepProvider`    — navigation index, completed steps, next/prev/goTo
 *
 * `StepProvider` is nested inside `JobFormProvider` because `useStepNavigation`
 * reads `touched` and `setTouched` from `JobFormContext`.
 */
function CreateJobForm() {
  const formState = useCreateJobFormData();

  useEffect(() => {
    document.title = "Create Job Posting";
  }, []);

  return (
    <Layout>
      <JobFormProvider value={formState}>
        <StepShell />
      </JobFormProvider>
    </Layout>
  );
}

/**
 * StepShell
 * ---------
 * Rendered inside `JobFormProvider` so `useStepNavigation` can call
 * `useJobForm()`. Wraps the rest of the tree in `StepProvider`.
 */
function StepShell() {
  const stepState = useStepNavigation();

  return (
    <StepProvider value={stepState}>
      <FormContent />
    </StepProvider>
  );
}

/**
 * FormContent
 * -----------
 * Reads from both contexts independently — only what it actually needs.
 */
function FormContent() {
  const { handleKeyDown, hasDraft, clearDraft, setFormData } = useJobForm();
  const { currentStepIndex, isNextAllowed, nextStep, prevStep, currentStep } = useStepContext();
  const { handleFormSubmit, isSubmitting } = useCreateJobFormSubmission();

  const StepComponent = currentStep.component;

  const handleSubmit = async (e: React.FormEvent) => {
    await handleFormSubmit(e);
    clearDraft();
  };

  const handleDiscardDraft = () => {
    setFormData(CREATE_JOB_INITIAL_FORM_DATA);
    clearDraft();
  };

  return (
    <div className="form-container" id="multi-step-form">
      <StepsContainer />

      <form
        className="form-panel"
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        style={{ flex: "3", marginRight: "4.5rem" }}
      >
        {hasDraft && currentStepIndex === 0 && (
          <div className="draft-banner" role="status">
            <span>Draft restored — pick up where you left off.</span>
            <button
              type="button"
              className="draft-banner__discard"
              onClick={handleDiscardDraft}
            >
              Discard
            </button>
          </div>
        )}

        {StepComponent && <StepComponent />}

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
              {isSubmitting ? "Submitting..." : "Submit"}
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
      </form>
    </div>
  );
}

export default CreateJobForm;