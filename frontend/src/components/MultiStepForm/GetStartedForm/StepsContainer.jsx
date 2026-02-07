import { JOBSEEKER_STEPS, EMPLOYER_STEPS } from "../../../../constants/steps";

const StepsContainer = ({ selectedRole }) => {
    const steps =
    selectedRole === "jobseeker"
        ? JOBSEEKER_STEPS
        : selectedRole === "employer"
        ? EMPLOYER_STEPS
        : [];

    return (
        <div className="steps">
            <header>
                <h2>Let's get started</h2>
                <p className="subheader">
                    You've successfully verified your email. 
                    Let's set up your profile to get the best experience.
                </p>
            </header>
            <ul>
                {steps.map((step) => (
                    <li key={step.key}>
                        <i className={step.icon}></i>
                        <span>{step.title}</span>
                        <p className="supporting-text">{step.description}</p>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default StepsContainer