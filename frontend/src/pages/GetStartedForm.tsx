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

function GetStartedForm() {
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();

    const [originalUser, setOriginalUser] = useState<any>(null);
    
    // Save the original user data before the patch request
    useEffect(() => {
        if (!originalUser && user) {
            setOriginalUser(user); // Only set the original user once
        }
    }, [user, originalUser]);

    const { selectedRole, setSelectedRole } = useRoleSelection();

    const {
        formData,
        setFormData,
        handleChange,
        handleKeyDown,
        handleRemoveListItem,
        handleDragEnd,
    } = useGetStartedFormData(selectedRole, originalUser?._id || null);

    const { currentStepIndex, isNextAllowed, nextStep, prevStep, steps } =
        useStepNavigation(selectedRole, formData, originalUser);

    const { handleFormSubmit, error, isLoading } = useGetStartedFormSubmission({
        formData,
        selectedRole,
        user,
        navigate,
    });

    useEffect(() => {
        document.title = "Let's get started";
    }, []);

    const currentStep = steps[currentStepIndex];

    // Return only role selection page if no formdata exists yet/role has been selected yet
    if (!formData) {
        return (
            <div className="form-container" id="multi-step-form">
                <StepsContainer
                    selectedRole={selectedRole}
                    currentStepIndex={currentStepIndex}
                />
                <div className="form-panel">
                    <RoleSection
                        selectedRole={selectedRole}
                        setSelectedRole={setSelectedRole}
                    />
                    <div
                        className="buttons"
                        style={{
                            justifyContent:
                                currentStepIndex > 0 ? "space-between" : "flex-end",
                        }}
                    >
                        {currentStepIndex > 0 && (
                            <button onClick={prevStep} id="prev-step-btn" type="button">
                                Previous
                            </button>
                        )}
                        {isNextAllowed && (
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
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="form-container" id="multi-step-form">
                <StepsContainer
                    selectedRole={selectedRole}
                    currentStepIndex={currentStepIndex}
                />
                <form
                    className="form-panel"
                    onSubmit={handleFormSubmit}
                    onKeyDown={handleKeyDown}
                >
                    {/* ROLE SELECTION SECTION */}
                    {currentStep.key === "role" && (
                        <RoleSection
                            selectedRole={selectedRole}
                            setSelectedRole={setSelectedRole}
                        />
                    )}

                    {/* USER DETAILS SECTION */}
                    {currentStep.key === "details" && (
                        <UserDetailsSection
                            selectedRole={selectedRole}
                            formData={formData}
                            handleChange={handleChange}
                        />
                    )}

                    {/* ROLE-SPECIFIC SECTIONS */}
                    {selectedRole === "jobseeker" ? (
                        <>
                            {/* SKILLS SECTION */}
                            {currentStep.key === "skills" && (
                                <SkillsSection
                                    selectedRole={selectedRole}
                                    formData={formData}
                                    setFormData={setFormData}
                                    handleChange={handleChange}
                                    handleDrag={handleDragEnd}
                                    handleRemove={handleRemoveListItem}
                                />
                            )}

                            {/* WORK EXPERIENCE SECTION */}
                            {currentStep.key === "workExperience" && (
                                <WorkExperience
                                    formData={formData}
                                    setFormData={setFormData}
                                    handleDrag={handleDragEnd}
                                    handleRemove={handleRemoveListItem}
                                />
                            )}

                            {/* RESUME TEMPLATE SECTION - Add this component if you have it */}
                            {currentStep.key === "resume" && (
                                <div>
                                    <h3>Resume Template Selection</h3>
                                    <p>Resume template picker would go here</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* INDUSTRY SECTION */}
                            {currentStep.key === "industry" && (
                                <IndustrySection
                                    formData={formData}
                                    handleChange={handleChange}
                                />
                            )}
                        </>
                    )}

                    {/* FINISHED */}
                    {currentStep.key === "finished" && (
                        <WelcomeSection selectedRole={selectedRole} />
                    )}

                    <div
                        className="buttons"
                        style={{
                            justifyContent:
                                currentStepIndex > 0 ? "space-between" : "flex-end",
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
            {error && (
                <div className="error-message" style={{ color: "red", padding: "1rem" }}>
                    {error}
                </div>
            )}
        </>
    );
}

export default GetStartedForm;