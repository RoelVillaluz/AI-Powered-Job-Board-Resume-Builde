import { useEffect, useRef } from "react";
import { useDraftStore } from "../stores/draftStore";
import { useDebounce } from "./useDebounce";

/**
 * useDraftPersistence
 * --------------------
 * Reusable hook that connects a form's current state to the generic draft
 * store. Form-specific only in the `key` and `data` it receives — the
 * persistence logic itself is identical across all forms.
 *
 * ## What it does
 * - **On mount**: restores a saved draft by calling `onRestore` if one exists.
 *   `onRestore` is typically `setFormData` from the form's context.
 * - **On data change**: debounces writes to the draft store so rapid keystrokes
 *   don't trigger a store update on every character.
 * - **Returns `clearDraft`**: call this on successful form submission to clean up.
 *
 * ## Usage
 * ```ts
 * // Inside a form-specific hook or the form's context provider component:
 * const { clearDraft } = useDraftPersistence({
 *   key: "create-job-form",
 *   data: formData,
 *   onRestore: setFormData,
 * });
 * ```
 *
 * @param key        - Unique string identifying this form's draft in the store
 * @param data       - Current form state to persist (the full formData object)
 * @param onRestore  - Called with the saved draft data on mount if a draft exists;
 *                     typically the form's `setFormData` dispatcher
 * @param debounceMs - How long to wait after the last change before writing to
 *                     the store (default: 1000ms)
 */
export const useDraftPersistence = <T>({
  key,
  data,
  onRestore,
  debounceMs = 1000,
}: {
  key: string;
  data: T;
  onRestore: (draft: T) => void;
  debounceMs?: number;
}) => {
  const { saveDraft, loadDraft, clearDraft, hasDraft } = useDraftStore();
  const debouncedData = useDebounce(data, debounceMs);

  // Track whether we've already restored on mount so we don't
  // immediately overwrite a just-restored draft with stale initial state
  const hasRestored = useRef(false);

  // ── On mount: restore draft if one exists ──────────────────────────────────
  useEffect(() => {
    if (hasDraft(key)) {
      try {
        const saved = loadDraft(key) as T;
        onRestore(saved);
      } catch {
        // Draft data is corrupt — clear it and start fresh
        clearDraft(key);
      }
    }
    hasRestored.current = true;
  }, []); // intentionally empty — runs once on mount only

  // ── On data change: write debounced snapshot to store ─────────────────────
  useEffect(() => {
    // Skip the first write triggered by the initial mount/restore
    // to avoid immediately overwriting the restored data with defaults
    if (!hasRestored.current) return;
    saveDraft(key, debouncedData);
  }, [debouncedData]);

  return {
    /** Call on successful form submission to remove the draft from the store. */
    clearDraft: () => clearDraft(key),
    /** Whether a draft currently exists for this form key. */
    hasDraft: hasDraft(key),
  };
};