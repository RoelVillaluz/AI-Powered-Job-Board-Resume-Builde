import { useEffect, useRef } from "react";
import { useDraftStore } from "../stores/draftStore";
import { useDebounce } from "./useDebounce";

/**
 * useDraftPersistence
 * --------------------
 * Connects a piece of state to the generic draft store. Debounces writes
 * and optionally restores on mount via `onRestore`.
 *
 * @param key              - Unique draft key
 * @param data             - Current state snapshot to persist
 * @param onRestore        - Called with saved data on mount if a draft exists
 * @param debounceMs       - Write debounce delay (default: 1000ms)
 * @param skipRestoreOnMount - Pass `true` when the caller has already seeded
 *                           state synchronously via `useDraftStore.getState()`.
 *                           Skips the mount-time `onRestore` call to avoid a
 *                           redundant or race-condition re-set.
 */
export const useDraftPersistence = <T>({
  key,
  data,
  onRestore,
  debounceMs = 1000,
  skipRestoreOnMount = false,
}: {
  key: string;
  data: T;
  onRestore: (draft: T) => void;
  debounceMs?: number;
  skipRestoreOnMount?: boolean;
}) => {
  const { saveDraft, loadDraft, clearDraft, hasDraft } = useDraftStore();
  const debouncedData = useDebounce(data, debounceMs);
  const hasRestored = useRef(false);

  // On mount: restore if a draft exists and we haven't already seeded
  useEffect(() => {
    if (!skipRestoreOnMount && hasDraft(key)) {
      try {
        const saved = loadDraft(key) as T;
        onRestore(saved);
      } catch {
        clearDraft(key);
      }
    }
    hasRestored.current = true;
  }, []);

  // On data change: write debounced snapshot
  useEffect(() => {
    if (!hasRestored.current) return;
    saveDraft(key, debouncedData);
  }, [debouncedData]);

  return {
    clearDraft: () => clearDraft(key),
    hasDraft: hasDraft(key),
  };
};