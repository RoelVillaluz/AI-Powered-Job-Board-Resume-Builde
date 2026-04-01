import { useEffect } from "react";
import Layout from "../components/Layout.jsx";
import { StepsContainer } from "../components/MultiStepForm/CreateJobForm/StepsContainer.js";
import { JobFormProvider } from "../contexts/JobPostingFormContext.js";
import { useCreateJobFormData } from "../hooks/createJobForm/useCreateJobFormData.js";
import { useStepNavigation } from "../hooks/createJobForm/useStepNavigation.js";
import { useCreateJobFormSubmission } from "../hooks/createJobForm/useCreateFormSubmission.js";
import { useJobForm } from "../contexts/JobPostingFormContext.js";
import { CREATE_JOB_INITIAL_FORM_DATA } from "../../constants/formSchemas";

function CreateJobForm() {
  const formState = useCreateJobFormData();

  useEffect(() => {
    document.title = "Create Job Posting";
  }, []);

  return (
    <Layout>
      <JobFormProvider value={formState}>
        <FormContent />
      </JobFormProvider>
    </Layout>
  );
}

function FormContent() {
  const { handleKeyDown, hasDraft, clearDraft, setFormData } = useJobForm();
  const { handleFormSubmit, isSubmitting } = useCreateJobFormSubmission();
  const { currentStepIndex, steps, isNextAllowed, nextStep, prevStep } = useStepNavigation();

  const currentStep = steps[currentStepIndex];
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
      <StepsContainer currentStepIndex={currentStepIndex} />

      <form
        className="form-panel"
        onSubmit={handleSubmit}
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