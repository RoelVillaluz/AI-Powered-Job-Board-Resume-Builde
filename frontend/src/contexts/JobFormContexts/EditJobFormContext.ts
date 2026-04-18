import { createContext, useContext } from "react";
import type { CreateJobFormData } from "../../../types/forms/createJobForm.types";
import type { SelectOption } from "../../hooks/createJobForm/useCreateJobFormData";

type EditJobFormContextValue = {
  formData: CreateJobFormData;
  setFormData: React.Dispatch<React.SetStateAction<CreateJobFormData>>;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  handleSelect: (field: "title" | "location", option: SelectOption) => void;
  handleClearSelection: (field: "title" | "location") => void;
  handleUndoChanges: () => void;
};

const EditJobFormContext = createContext<EditJobFormContextValue | null>(null);

export const EditJobFormProvider = EditJobFormContext.Provider;

/**
 * useEditJobForm
 * ---------------
 * Reads edit form state from the nearest `EditJobFormProvider`.
 * The provider is set up in `EditJobDetailPage` once the job data has loaded.
 *
 * @throws If called outside of an `EditJobFormProvider`
 */
export function useEditJobForm(): EditJobFormContextValue {
  const ctx = useContext(EditJobFormContext);
  if (!ctx) throw new Error("useEditJobForm must be used within an EditJobFormProvider");
  return ctx;
}