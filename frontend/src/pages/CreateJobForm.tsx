import { useEffect } from "react";
import Layout from "../components/Layout.jsx";
import { StepsContainer } from "../components/MultiStepForm/CreateJobForm/StepsContainer.js";
import { useStepNavigation } from "../hooks/createJobForm/useStepNavigation.js";
import { useCreateJobFormData } from "../hooks/createJobForm/useCreateJobFormData.js";
import { useCreateJobFormSubmission } from "../hooks/createJobForm/useCreateFormSubmission.js";
import JobDetailsSection from "../components/MultiStepForm/CreateJobForm/JobDetailsSection.js";

function CreateJobForm() {
  const { formData, handleChange, handleKeyDown, handleSelect } = useCreateJobFormData();
  const { handleFormSubmit, isLoading } = useCreateJobFormSubmission(formData);
  const { currentStepIndex, steps, isNextAllowed, nextStep, prevStep } =
    useStepNavigation(formData);

  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    document.title = "Create Job Posting";
  }, []);

  return (
    <Layout>
      <div className="form-container" id="multi-step-form">
        <StepsContainer currentStepIndex={currentStepIndex} />
        <form
          className="form-panel"
          onSubmit={handleFormSubmit}
          onKeyDown={handleKeyDown}
          style={{ flex: "3", marginRight: "4.5rem" }}
        >
          {currentStep.key === "details" && (
            <JobDetailsSection
              formData={formData}
              handleChange={handleChange}
              handleSelect={handleSelect}
            />
          )}

          <div
            className="buttons"
            style={{
              justifyContent: currentStepIndex > 0 ? "space-between" : "flex-end",
            }}
          >
            {currentStepIndex > 0 && (
              <button onClick={prevStep} id="prev-step-btn" type="button">
                Previous
              </button>
            )}

            {currentStep.key === "finished" ? (
              <button id="submit-btn" type="submit" disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit"}
              </button>
            ) : (
              isNextAllowed && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    nextStep();
                  }}
                  id="next-step-btn"
                  type="button"
                >
                  Next
                </button>
              )
            )}
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default CreateJobForm;