import { useState } from "react";
import type { CreateJobFormData } from "../../../types/forms/createJobForm.types";
import { CREATE_JOB_INITIAL_FORM_DATA } from "../../../constants/formSchemas";

export type SelectOption = {
  _id?: string;
  name: string;
};

/**
 * Sets a deeply nested value on an object given a dot-separated key path,
 * returning a new object (immutable update). Supports paths like "salary.min".
 *
 * @param obj   - The source object to update
 * @param path  - Dot-separated key path, e.g. "salary.min" or "title"
 * @param value - The new value to set at that path
 * @returns A new object with the value set at the given path
 */
function setDeep<T extends Record<string, any>>(obj: T, path: string, value: any): T {
  const keys = path.split(".");
  if (keys.length === 1) {
    return { ...obj, [path]: value };
  }
  const [head, ...rest] = keys;
  return {
    ...obj,
    [head]: setDeep(obj[head] ?? {}, rest.join("."), value),
  };
}

/**
 * useCreateJobFormData
 * ---------------------
 * Manages all state and update logic for the Create Job multi-step form.
 *
 * Exposes:
 * - `formData`     — the current form state
 * - `setFormData`  — direct setter for bulk updates (e.g. loading a draft)
 * - `handleChange` — generic change handler for text inputs and textareas;
 *                    supports dot-notation `name` attributes for nested fields
 *                    (e.g. name="salary.min")
 * - `handleSelect` — handler for SearchableSelect; stores the full `{_id, name}`
 *                    object on a top-level field (e.g. "title", "location")
 * - `handleKeyDown`— prevents Enter from accidentally submitting the form
 *
 * @example
 * const { formData, handleChange, handleSelect } = useCreateJobFormData();
 *
 * // Text input
 * <input name="experienceLevel" onChange={handleChange} />
 *
 * // Nested field (maps to formData.salary.min)
 * <input name="salary.min" onChange={handleChange} />
 *
 * // SearchableSelect
 * <SearchableSelect onSelect={(opt) => handleSelect("title", opt)} />
 */
export const useCreateJobFormData = () => {
  const [formData, setFormData] = useState<CreateJobFormData>(CREATE_JOB_INITIAL_FORM_DATA);

  /**
   * Generic change handler for `<input>` and `<textarea>` elements.
   * Reads `e.target.name` as a dot-separated path so nested fields
   * like "salary.min" are updated without custom branching logic.
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => setDeep(prev, name, value));
  };

  /**
   * Stores the selected `{_id, name}` option from a SearchableSelect on
   * a top-level field. For example, selecting a job title writes to
   * `formData.title` and selecting a location writes to `formData.location`.
   *
   * @param field  - The top-level formData key to update
   * @param option - The selected option from SearchableSelect
   */
  const handleSelect = (
    field: "title" | "location" | "skill",
    option: SelectOption
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: {
        _id: option._id,
        name: option.name,
      },
    }));
  };

  const handleClearSelection = (
    field: "title" | "location" | "skill",
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: {
        _id: '',
        name: '',
      }
    }))
  }

  /** Prevents accidental form submission when the user presses Enter in an input. */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") e.preventDefault();
  };

  return { formData, setFormData, handleChange, handleKeyDown, handleSelect, handleClearSelection };
};