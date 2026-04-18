import { useEffect } from "react";
import Layout from "../components/Layout.jsx";
import { StepsContainer } from "../components/MultiStepForm/CreateJobForm/StepsContainer.js";
import { JobFormProvider } from "../contexts/JobFormContexts/JobPostingFormContext.js";
import { StepProvider } from "../contexts/JobFormContexts/StepContext.js";
import { DRAFT_KEY, useCreateJobFormData } from "../hooks/createJobForm/useCreateJobFormData.js";
import { STEP_DRAFT_KEY, useStepNavigation } from "../hooks/createJobForm/useStepNavigation.js";
import { useCreateJobFormSubmission } from "../hooks/createJobForm/useCreateFormSubmission.js";
import { useJobForm } from "../contexts/JobFormContexts/JobPostingFormContext.js";
import { useStepContext } from "../contexts/JobFormContexts/StepContext.js";
import { CREATE_JOB_INITIAL_FORM_DATA } from "../../constants/formSchemas.js";
import { FormButtonControls } from "../components/FormComponents/FormButtonControls.js";
import { useDraftStore } from "../stores/draftStore.js";

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
  const { handleKeyDown, formData, setFormData } = useJobForm();
  const { currentStepIndex, isNextAllowed, nextStep, prevStep, currentStep } = useStepContext();
  const { handleFormSubmit, isSubmitting } = useCreateJobFormSubmission();
  const hasDraft = useDraftStore((state) => state.hasDraft);
  const clearDraft = useDraftStore((state) => state.clearDraft);

  const StepComponent = currentStep.component;

  const handleSubmit = async (e: React.FormEvent) => {
    await handleFormSubmit(e);
    clearDraft(DRAFT_KEY);
  };

  const handleDiscardDraft = () => {
    setFormData(CREATE_JOB_INITIAL_FORM_DATA);
    clearDraft(DRAFT_KEY);
    clearDraft(STEP_DRAFT_KEY); 
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

        {StepComponent && <StepComponent />}

        <FormButtonControls
          currentStepIndex={currentStepIndex}
          currentStep={currentStep}
          prevStep={prevStep}
          nextStep={nextStep}
          isSubmitting={isSubmitting} 
          isNextAllowed={isNextAllowed}
          hasDraft={hasDraft(DRAFT_KEY)}
          discardDraft={handleDiscardDraft} 
        />
      </form>
    </div>
  );
}

export default CreateJobForm;