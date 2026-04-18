import { createContext, useContext } from "react";
import type { SelectOption } from "../../hooks/createJobForm/useCreateJobFormData";
import type { CreateJobFormData } from "../../../types/forms/createJobForm.types";

type JobFormContextValue = {
  formData: CreateJobFormData;
  setFormData: React.Dispatch<React.SetStateAction<CreateJobFormData>>;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  handleSelect: (field: "title" | "location", option: SelectOption) => void;
  handleClearSelection: (field: "title" | "location") => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  /**
   * The set of field names the user has interacted with.
   *
   * Errors are always computed from the full formData, but they are only
   * *shown* for fields present in this set. This prevents the form from
   * opening in a wall-of-red state before the user has done anything.
   *
   * A field enters `touched` in one of two ways:
   * - The user blurs the field → the component calls `touch("fieldName")`
   * - The user clicks Next while the step is invalid → `touchAll()` adds
   *   every currently-invalid field at once so nothing is silently hidden
   *
   * Reset to an empty Set on every successful step advance so each step
   * opens clean with no inherited error state from the previous step.
   */
  touched: Set<string>;
  setTouched: React.Dispatch<React.SetStateAction<Set<string>>>;
  clearDraft: () => void;
  /** True if a draft was found in the store on mount. */
  hasDraft: boolean;
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