import { CREATE_JOB_STEPS } from "../../../../constants/steps"

type StepsContainerProps = {
    currentStepIndex: number;
}

export const StepsContainer = ({ currentStepIndex }: StepsContainerProps) => {
    return (
        <div className="steps">
            <header>
                <h2>Let's make a job posting.</h2>
                <p className="subheader">Ready to find the perfect candidate? Fill out the details below to create your job posting and start connecting with talent.</p>
            </header>

            <ul>
                {CREATE_JOB_STEPS.map((step, index) => (
                    <li key={step.key} className={currentStepIndex === index ? 'active' : ''}>
                        <i className={step.icon}></i>
                        <span>{step.title}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}