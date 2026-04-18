import { useState, useEffect } from "react";
import type { CreateJobFormData } from "../../../types/forms/createJobForm.types";
import type { JobPosting } from "../../../../shared/types/jobPostingTypes";
import { CREATE_JOB_INITIAL_FORM_DATA } from "../../../constants/formSchemas";
import { setDeep } from "../../utils/forms/formUtils";
import { mapJobToFormData } from "../../utils/jobPostings/mappers";
import type { SelectOption } from "../createJobForm/useCreateJobFormData";

/**
 * useEditJobFormData
 * -------------------
 * Manages form state for the Edit Job page. Accepts the fetched `job`
 * from the parent query and prefills `formData` once it arrives.
 *
 * Tracks `originalData` separately so `handleUndoChanges` can reset
 * to the server state without refetching.
 *
 * @param job - The fetched job posting; may be undefined while loading
 */
export const useEditJobFormData = (job: JobPosting | undefined) => {
  // Always initialise with a valid CreateJobFormData shape — never undefined.
  // This avoids the TypeScript error caused by useState<CreateJobFormData>()
  // with no initial value, which infers `CreateJobFormData | undefined`.
  const [formData, setFormData] = useState<CreateJobFormData>(
    CREATE_JOB_INITIAL_FORM_DATA
  );

  // Snapshot of the server state — used by handleUndoChanges
  const [originalData, setOriginalData] = useState<CreateJobFormData>(
    CREATE_JOB_INITIAL_FORM_DATA
  );

  // Prefill once job data arrives (covers both initial load and refetch)
  useEffect(() => {
    if (!job) return;
    const mapped = mapJobToFormData(job);
    setFormData(mapped);
    setOriginalData(mapped);
  }, [job]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => setDeep(prev, name, value) as CreateJobFormData);
  };

  const handleSelect = (field: "title" | "location", option: SelectOption) => {
    setFormData((prev) => ({
      ...prev,
      [field]: { _id: option._id, name: option.name },
    }));
  };

  const handleClearSelection = (field: "title" | "location") => {
    setFormData((prev) => ({
      ...prev,
      [field]: { _id: "", name: "" },
    }));
  };

  /** Resets form back to the last server-fetched state without a network call. */
  const handleUndoChanges = () => {
    setFormData(originalData);
  };

  return {
    formData,
    setFormData,
    handleChange,
    handleSelect,
    handleClearSelection,
    handleUndoChanges,
    originalData,
  };
};