import { EMPLOYER_STEPS, JOBSEEKER_STEPS, ROLE_SELECTION_STEP } from "../../../../constants/steps";
import type { UserRole } from "../../../../types/forms/getStartedForm.types";

interface StepsContainerProps {
    selectedRole: UserRole;
    currentStepIndex: number;
}

const StepsContainer = ({ selectedRole, currentStepIndex }: StepsContainerProps) => {

    const steps = 
        selectedRole === 'jobseeker'
        ? JOBSEEKER_STEPS
        : selectedRole === 'employer'
        ? EMPLOYER_STEPS
        : [ROLE_SELECTION_STEP]

    return (
        <div className="steps">
            <header>
                <h2>Let's get started</h2>
                <p className="subheader">
                    You've successfully verified your email. Let's set up your profile to get the
                    best experience.
                </p>
            </header>
            {steps.map((step, index) => (
                <ul>
                    <li key={step.key} className={currentStepIndex === index ? 'active' : ''}>
                        <i className={step.icon}></i>
                        <div>
                            <span>{step.title}</span>
                            <p className="supporting-text">{step.description}</p>
                        </div>
                    </li>
                </ul>
            ))}
        </div>
    );
};

export default StepsContainer;