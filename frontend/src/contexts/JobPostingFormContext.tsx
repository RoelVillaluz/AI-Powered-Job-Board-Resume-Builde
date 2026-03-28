import { createContext, useContext } from "react";
import type { SelectOption } from "../hooks/createJobForm/useCreateJobFormData";
import type { CreateJobFormData } from "../../types/forms/createJobForm.types";

type JobFormContextValue = {
  formData: CreateJobFormData;
  setFormData: React.Dispatch<React.SetStateAction<CreateJobFormData>>;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  handleSelect: (field: "title" | "location" | "skill", option: SelectOption) => void;
  handleClearSelection: (field: "title" | "location" | "skill") => void; 
};

const JobFormContext = createContext<JobFormContextValue | null>(null);

export const JobFormProvider = JobFormContext.Provider;

/**
 * useJobForm
 * ----------
 * Reads form state and updaters from the nearest `JobFormProvider`.
 * Use inside any field component to avoid prop drilling.
 *
 * Step navigation and form submission are intentionally excluded —
 * those belong at the page level in `CreateJobForm`.
 *
 * @throws If called outside of a `JobFormProvider`
 */
export function useJobForm(): JobFormContextValue {
  const ctx = useContext(JobFormContext);
  if (!ctx) throw new Error("useJobForm must be used within a JobFormProvider");
  return ctx;
}