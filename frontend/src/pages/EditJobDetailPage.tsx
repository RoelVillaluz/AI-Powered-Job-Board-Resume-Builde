import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { useJobPosting as useJobPostingJS } from "../hooks/jobs/useJobQueries";
import type { JobPosting } from "../../../shared/types/jobPostingTypes";
import { EditJobFormProvider } from "../contexts/JobFormContexts/EditJobFormContext";
import { useEditJobFormData } from "../hooks/editJobForm/useEditJobFormData";
import { GenericEditorForm } from "../components/FormComponents/GenericEditorForm";
import Layout from "../components/Layout";
import { useAuthStore } from "../stores/authStore";

export default function EditJobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const user = useAuthStore((state) => state.user)
  const { data, isLoading, error } = useJobPostingJS(jobId);
  const job = data as JobPosting | undefined;

  const hasPermission = user.company._id === job?.company._id

  useEffect(() => {
    if (job) {
      document.title = `Editing ${job.title.name}`;
    }
  }, [jobId, job?.title.name]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-sm text-red-500">Failed to load job posting.</p>
        </div>
      </Layout>
    );
  }

  if (hasPermission) {
    return (
      <Layout>
        <EditJobFormShell job={job} />
      </Layout>
    );
  }
}

/**
 * EditJobFormShell
 * -----------------
 * Rendered after loading resolves. Owns form state via `useEditJobFormData`,
 * which prefills from `job` via `useEffect` once data arrives.
 * Wraps `EditorForm` in `EditJobFormProvider` so field components can
 * read and update form state via `useEditJobForm()`.
 */
function EditJobFormShell({ job }: { job: JobPosting | undefined }) {
  const {
    formData,
    setFormData,
    handleChange,
    handleSelect,
    handleClearSelection,
    handleUndoChanges,
  } = useEditJobFormData(job);

  const logo = job?.company.logo;

  return (
    <EditJobFormProvider
      value={{ formData, setFormData, handleChange, handleSelect, handleClearSelection, handleUndoChanges }}
    >
      <GenericEditorForm
        logo={logo}
        job={job}
      />
    </EditJobFormProvider>
  );
}