import { useEditJobForm } from "../../contexts/JobFormContexts/EditJobFormContext";
import { EditorJobFormPanel } from "../EditJobForm/EditJobFormPanel";
import { useEditFormSubmission } from "../../hooks/editJobForm/useEditFormSubmission";
import type { JobPosting } from "../../../../shared/types/jobPostingTypes";
import { Link } from "react-router-dom";

export const GenericEditorForm = ({ logo, job }: { logo?: string, job: JobPosting | undefined }) => {
  const { formData } = useEditJobForm();
  const { handleFormSubmit, isSubmitting } = useEditFormSubmission(job?._id ?? "");

  return (
    <form className="editor-form" onSubmit={handleFormSubmit}>
        <div className="editor-form__header">
            <img src={`/${logo}`} className="header-logo" />

            <div className="column">
                <div className="row">
                    <h1>{formData.title?.name ?? ""}</h1>
                    <Link to={`/job-postings/${job?._id}`}>
                        <i className="fa fa-angle-right" aria-label="Go to job posting" aria-hidden="true"></i>
                    </Link>
                </div>
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