import { useEffect } from "react";
import Layout from "../components/Layout.jsx";
import { StepsContainer } from "../components/MultiStepForm/CreateJobForm/StepsContainer.js";
import { JobFormProvider } from "../contexts/JobPostingFormContext.js";
import { useCreateJobFormData } from "../hooks/createJobForm/useCreateJobFormData.js";
import { useStepNavigation } from "../hooks/createJobForm/useStepNavigation.js";
import { useCreateJobFormSubmission } from "../hooks/createJobForm/useCreateFormSubmission.js";

/**
 * CreateJobForm
 * -------------
 * Page-level component for the multi-step job posting form.
 *
 * Owns:
 * - Form state (via useCreateJobFormData) — exposed to the tree via JobFormProvider
 * - Step navigation (via useStepNavigation)
 * - Form submission (via useCreateJobFormSubmission)
 *
 * Field components read formData and handleChange directly from
 * JobFormContext via useJobForm(), so no props are drilled through
 * intermediate layout components.
 */
function CreateJobForm() {
  // Form state — provided to the whole tree via context
  const formState = useCreateJobFormData();
  const { handleKeyDown } = formState;

  useEffect(() => {
    document.title = "Create Job Posting";
  }, []);

  return (
    <Layout>
      <JobFormProvider value={formState}>
        <FormContent handleKeyDown={handleKeyDown} />
      </JobFormProvider>
    </Layout>
  );
}

/**
 * FormContent
 * -----------
 * Inner shell rendered inside JobFormProvider so that useStepNavigation
 * and useCreateJobFormSubmission can both call useJobForm().
 */
function FormContent({ handleKeyDown }: { handleKeyDown: (e: React.KeyboardEvent) => void }) {
  const { handleFormSubmit, isSubmitting } = useCreateJobFormSubmission();
  const { currentStepIndex, steps, isNextAllowed, nextStep, prevStep } = useStepNavigation();
  
  const currentStep = steps[currentStepIndex];

  const StepComponent = currentStep.component;

  return (
    <div className="form-container" id="multi-step-form">
      <StepsContainer currentStepIndex={currentStepIndex} />

      <form
        className="form-panel"
        onSubmit={handleFormSubmit}
        onKeyDown={handleKeyDown}
        style={{ flex: "3", marginRight: "4.5rem" }}
      >
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