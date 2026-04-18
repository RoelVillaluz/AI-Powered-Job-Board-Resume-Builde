import { useJobForm } from "../../../../contexts/JobFormContexts/JobPostingFormContext"
import { useStepNavigation } from "../../../../hooks/createJobForm/useStepNavigation";
import { CREATE_JOB_SUMMARY_FIELDS } from "./summaryConfig";

export const FormSummary = () => {
    const { formData } = useJobForm();
    const { goToStep } = useStepNavigation();

    return (
        <div className="form-group">

            <div className="job-form-summary">

                <div className="column left">
                    {CREATE_JOB_SUMMARY_FIELDS.left.map(({ label, getValue, step }) => (
                        <div className="title-value-pair" key={label}>
                            <button type="button" onClick={() => goToStep(step)}>
                                {label}
                                <i className="fa-solid fa-angle-right" aria-hidden="true"></i>
                            </button>
                            <span>{getValue(formData)}</span>
                        </div>
                    ))}
                </div>

                <div className="column right">
                    {CREATE_JOB_SUMMARY_FIELDS.right.map(({ label, getValue, step }) => (
                        <div className="title-value-pair" key={label}>
                            <button type="button" onClick={() => goToStep(step)}>
                                {label}
                                <i className="fa-solid fa-angle-right" aria-hidden="true"></i>
                            </button>
                            <span>{getValue(formData)}</span>
                        </div>
                    ))}
                </div>

            </div>

        </div>
    )
}