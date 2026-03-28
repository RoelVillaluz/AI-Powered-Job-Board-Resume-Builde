import { useState } from "react";
import type { CreateJobFormData } from "../../../types/forms/createJobForm.types";
import { CREATE_JOB_INITIAL_FORM_DATA } from "../../../constants/formSchemas";

export type SelectOption = {
  _id?: string;
  name: string;
};

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

  /**
   * Tracks which field names the user has interacted with.
   * Only fields in this set will have their errors surfaced in the UI.
   * Reset to an empty Set on each step advance via `useStepNavigation`.
   */
  const [touched, setTouched] = useState<Set<string>>(new Set());

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
  };
};