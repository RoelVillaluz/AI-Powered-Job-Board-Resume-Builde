import { useState } from "react";
import type { CreateJobFormData } from "../../../types/forms/createJobForm.types";
import { CREATE_JOB_INITIAL_FORM_DATA } from "../../../constants/formSchemas";
import { useDraftPersistence } from "../useDraftPersistence";

export type SelectOption = {
  _id?: string;
  name: string;
};

const DRAFT_KEY = "create-job-form";
 
function setDeep<T extends Record<string, any>>(obj: T, path: string, value: any): T {
  const keys = path.split(".");
  if (keys.length === 1) return { ...obj, [path]: value };
  const [head, ...rest] = keys;
  return { ...obj, [head]: setDeep(obj[head] ?? {}, rest.join("."), value) };
}

/**
 * useCreateJobFormData
 * ---------------------
 * Manages all state for the Create Job multi-step form.
 * The return value is spread directly into `JobFormProvider` as its value.
 *
 * - `formData` / `setFormData`   — current form state
 * - `handleChange`               — dot-notation aware change handler
 * - `handleSelect`               — commits a SearchableSelect selection
 * - `handleClearSelection`       — resets a SearchableSelect field to empty
 * - `handleKeyDown`              — prevents accidental Enter submission
 * - `touched` / `setTouched`     — tracks which fields have been interacted
 *                                  with; consumed by `useFormValidation` to
 *                                  gate error visibility per field
 */
export const useCreateJobFormData = () => {
  const [formData, setFormData] = useState<CreateJobFormData>(CREATE_JOB_INITIAL_FORM_DATA);
  const [touched, setTouched] = useState<Set<string>>(new Set());
 
  const { clearDraft, hasDraft } = useDraftPersistence<CreateJobFormData>({
    key: DRAFT_KEY,
    data: formData,
    onRestore: setFormData,
    debounceMs: 1000,
  });
 
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => setDeep(prev, name, value));
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
 
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") e.preventDefault();
  };
 
  return {
    formData,
    setFormData,
    handleChange,
    handleKeyDown,
    handleSelect,
    handleClearSelection,
    touched,
    setTouched,
    clearDraft,
    hasDraft,
  };
};