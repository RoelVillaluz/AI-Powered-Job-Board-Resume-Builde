import { useStepContext } from "../../../contexts/JobFormContexts/StepContext";
import { CREATE_JOB_STEPS } from "../../../../constants/steps";

/**
 * StepsContainer
 * ---------------
 * Reads navigation state from `StepContext` only — no form data needed.
 * Because `useStepNavigation` is called once in `StepShell` and placed
 * into `StepProvider`, this component always sees the same instance as
 * `FormContent` — one shared counter, no sync issues.
 */
export const StepsContainer = () => {
  const { currentStepIndex, completedSteps, goToStep } = useStepContext();

  return (
    <div className="steps">
      <header>
        <h2>Let's make a job posting.</h2>
        <p className="subheader">
          Ready to find the perfect candidate? Fill out the details below to
          create your job posting and start connecting with talent.
        </p>
      </header>

      <ul>
        {CREATE_JOB_STEPS.map((step, index) => {
          const isActive = currentStepIndex === index;
          const isCompleted = completedSteps.has(step.key);
          const isClickable = isCompleted && !isActive;

          return (
            <li
              key={step.key}
              className={[
                isActive ? "active" : "",
                isCompleted ? "completed" : "",
                isClickable ? "clickable" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={isActive ? "step" : undefined}
              role={isClickable ? "button" : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onKeyDown={(e) => {
                if (isClickable && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  goToStep(step.key);
                }
              }}
            >
              <i
                className={isCompleted && !isActive ? "fa-solid fa-check" : step.icon}
                aria-hidden="true"
                onClick={() => isClickable && goToStep(step.key)}
              />
              <span>{step.title}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};