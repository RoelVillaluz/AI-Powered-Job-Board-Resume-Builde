import { useEffect, useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { useNavigate } from "react-router-dom";
import RoleSection from "../components/MultiStepForm/GetStartedForm/RoleSection";
import UserDetailsSection from "../components/MultiStepForm/GetStartedForm/UserDetailsSection";
import SkillsSection from "../components/MultiStepForm/GetStartedForm/SkillsSection";
import WorkExperience from "../components/MultiStepForm/GetStartedForm/WorkExperience";
import WelcomeSection from "../components/MultiStepForm/GetStartedForm/WelcomeSection";
import IndustrySection from "../components/Dashboard/IndustrySection";
import StepsContainer from "../components/MultiStepForm/GetStartedForm/StepsContainer";
import { useGetStartedFormSubmission } from "../hooks/getStartedForm/useGetStartedFormSubmission";
import { useGetStartedFormData } from "../hooks/getStartedForm/useGetStartedFormData";
import { useStepNavigation } from "../hooks/getStartedForm/useStepNavigation";
import { useRoleSelection } from "../hooks/getStartedForm/useRoleSelection";
import {
  GetStartedFormProvider,
  useGetStartedForm,
} from "../contexts/GetStartedFormContext";

/**
 * GetStartedForm
 * --------------
 * Owns originalUser and seeds GetStartedFormProvider with form state
 * and role selection. Step navigation reads from the context via
 * GetStartedShell, keeping this component free of prop drilling.
 */
function GetStartedForm() {
  const user = useAuthStore((state) => state.user);
  const [originalUser, setOriginalUser] = useState<any>(null);

  useEffect(() => {
    if (!originalUser && user) setOriginalUser(user);
  }, [user, originalUser]);

  useEffect(() => {
    document.title = "Let's get started";
  }, []);

  const { selectedRole, setSelectedRole } = useRoleSelection();

  const formState = useGetStartedFormData(selectedRole, originalUser?._id || null);

  return (
    <GetStartedFormProvider value={{ ...formState, selectedRole, setSelectedRole }}>
      <GetStartedShell originalUser={originalUser} />
    </GetStartedFormProvider>
  );
}

/**
 * GetStartedShell
 * ---------------
 * Rendered inside GetStartedFormProvider so useStepNavigation can
 * read formData and selectedRole from context rather than props.
 */
function GetStartedShell({ originalUser }: { originalUser: any }) {
  const { formData, selectedRole } = useGetStartedForm();
  const { currentStepIndex, isNextAllowed, nextStep, prevStep, steps } =
    useStepNavigation(selectedRole, formData, originalUser);

  return (
    <GetStartedContent
      currentStepIndex={currentStepIndex}
      isNextAllowed={isNextAllowed}
      nextStep={nextStep}
      prevStep={prevStep}
      steps={steps}
      originalUser={originalUser}
    />
  );
}

/**
 * GetStartedContent
 * -----------------
 * Reads all form state from context. No props needed for form fields —
 * only navigation props from useStepNavigation are threaded down.
 */
type ContentProps = {
  currentStepIndex: number;
  isNextAllowed: boolean;
  nextStep: () => void;
  prevStep: () => void;
  steps: { key: string }[];
  originalUser: any;
};

function GetStartedContent({
  currentStepIndex,
  isNextAllowed,
  nextStep,
  prevStep,
  steps,
  originalUser,
}: ContentProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const {
    formData,
    setFormData,
    handleChange,
    handleKeyDown,
    handleRemoveListItem,
    handleDragEnd,
    selectedRole,
    setSelectedRole,
  } = useGetStartedForm();

  const { handleFormSubmit, error, isLoading } = useGetStartedFormSubmission({
    formData,
    selectedRole,
    user,
    navigate,
  });

  const currentStep = steps[currentStepIndex];

  const buttonRow = (
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
        <button id="submit-btn" type="submit" disabled={isLoading}>
          {isLoading ? "Submitting..." : "Submit"}
        </button>
      ) : (
        isNextAllowed && (
          <button
            onClick={(e) => { e.preventDefault(); nextStep(); }}
            id="next-step-btn"
            type="button"
          >
            Next
          </button>
        )
      )}
    </div>
  );

  // No role selected yet — show role picker only
  if (!formData) {
    return (
      <div className="form-container" id="multi-step-form">
        <StepsContainer selectedRole={selectedRole} currentStepIndex={currentStepIndex} />
        <div className="form-panel">
          <RoleSection selectedRole={selectedRole} setSelectedRole={setSelectedRole} />
          <div
            className="buttons"
            style={{ justifyContent: currentStepIndex > 0 ? "space-between" : "flex-end" }}
          >
            {currentStepIndex > 0 && (
              <button onClick={prevStep} id="prev-step-btn" type="button">Previous</button>
            )}
            {isNextAllowed && (
              <button
                onClick={(e) => { e.preventDefault(); nextStep(); }}
                id="next-step-btn"
                type="button"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="form-container" id="multi-step-form">
        <StepsContainer selectedRole={selectedRole} currentStepIndex={currentStepIndex} />
        <form className="form-panel" onSubmit={handleFormSubmit} onKeyDown={handleKeyDown}>

          {currentStep.key === "role" && (
            <RoleSection selectedRole={selectedRole} setSelectedRole={setSelectedRole} />
          )}

          {currentStep.key === "details" && (
            <UserDetailsSection/>
          )}

          {selectedRole === "jobseeker" ? (
            <>
              {currentStep.key === "skills" && (
                <SkillsSection/>
              )}
              {currentStep.key === "workExperience" && (
                <WorkExperience/>
              )}
              {currentStep.key === "resume" && (
                <div>
                  <h3>Resume Template Selection</h3>
                  <p>Resume template picker would go here</p>
                </div>
              )}
            </>
          ) : (
            <>
              {currentStep.key === "industry" && <IndustrySection />}
            </>
          )}

          {currentStep.key === "finished" && (
            <WelcomeSection selectedRole={selectedRole} />
          )}

          {buttonRow}
        </form>
      </div>

      {error && (
        <div className="error-message" style={{ color: "red", padding: "1rem" }}>
          {error}
        </div>
      )}
    </>
  );
}

export default GetStartedForm;