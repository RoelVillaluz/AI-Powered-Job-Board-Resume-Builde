import { useState } from "react";
import type { CreateJobFormData } from "../../../types/forms/createJobForm.types";
import { CREATE_JOB_INITIAL_FORM_DATA } from "../../../constants/formSchemas";
import { useDraftPersistence } from "../useDraftPersistence";
import { useDraftStore } from "../../stores/draftStore";

export type SelectOption = {
  _id?: string;
  name: string;
};

export const DRAFT_KEY = "create-job-form";

function setDeep<T extends Record<string, any>>(obj: T, path: string, value: any): T {
  const keys = path.split(".");
  if (keys.length === 1) return { ...obj, [path]: value };
  const [head, ...rest] = keys;
  return { ...obj, [head]: setDeep(obj[head] ?? {}, rest.join("."), value) };
}

/**
 * Reads the saved draft from the store synchronously — outside React's
 * render cycle. Used to seed `useState` initial values so components that
 * derive local state from `formData` (e.g. SearchableSelect search strings)
 * are correct on the very first render, not one render later.
 *
 * Returns `null` if no draft exists or if the draft data is malformed.
 */
function readDraftSync(): CreateJobFormData | null {
  try {
    const draft = useDraftStore.getState().loadDraft(DRAFT_KEY) as CreateJobFormData | null;
    return draft ?? null;
  } catch {
    return null;
  }
}

/**
 * useCreateJobFormData
 * ---------------------
 * Manages all state for the Create Job multi-step form.
 *
 * ## Synchronous draft seeding
 * `formData` is initialised directly from the draft store using
 * `useDraftStore.getState()` — Zustand's synchronous escape hatch.
 * This means the very first render already has the correct values,
 * so components like `SearchableSelect` that seed local state from
 * `formData` via `useState(formData.title.name)` get the right string
 * immediately rather than seeing an empty value and needing a re-sync.
 */
export const useCreateJobFormData = () => {
  // Seed synchronously so the initial render has the correct formData.
  // Falls back to the empty initial state if no draft exists.
  const [formData, setFormData] = useState<CreateJobFormData>(
    () => readDraftSync() ?? CREATE_JOB_INITIAL_FORM_DATA
  );
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // useDraftPersistence still handles ongoing persistence and the
  // onRestore callback (needed for cross-tab or future server-side restore).
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