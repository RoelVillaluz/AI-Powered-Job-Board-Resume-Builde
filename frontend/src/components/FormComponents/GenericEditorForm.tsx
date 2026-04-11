import { useEditJobForm } from "../../contexts/JobFormContexts/EditJobFormContext";
import type { CreateJobFormData } from "../../../types/forms/createJobForm.types";
import type { JobseekerFormData } from "../../../types/forms/getStartedForm.types";
import { EditorJobFormPanel } from "../EditJobForm/EditJobFormPanel";
import { useEditFormSubmission } from "../../hooks/editJobForm/useEditFormSubmission";
import type { JobPosting } from "../../../../shared/types/jobPostingTypes";

export const GenericEditorForm = ({ logo, job }: { logo?: string, job: JobPosting | undefined }) => {
  const { formData } = useEditJobForm();
  const { handleFormSubmit, isSubmitting } = useEditFormSubmission(job?._id ?? "");

  return (
    <form className="editor-form" onSubmit={handleFormSubmit}>
        <div className="editor-form__header">
            <img src={`/${logo}`} className="header-logo" />

            <div className="column">
            <h1>{formData.title?.name ?? ""}</h1>
            <h2>Editing Job Posting</h2>
            </div>
        </div>

        <div className="editor-form__divider" />

        <div className="editor-form__content">
            <EditorJobFormPanel />
        </div>

        <div className="editor-form__footer">
            <button type="button" className="editor-form__btn editor-form__btn--ghost">
                Reset
            </button>
            <button type="submit" className="editor-form__btn editor-form__btn--primary">
                {isSubmitting ? (
                    <div className="spinner" style={{ margin: 'auto' }}></div>
                ) : (
                    'Save'
                )}
            </button>
        </div>
    </form>
  );
};