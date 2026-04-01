import { create } from "zustand";
import { persist } from "zustand/middleware";
 
type DraftStore = {
  drafts: Record<string, unknown>;
  saveDraft: (key: string, data: unknown) => void;
  loadDraft: (key: string) => unknown;
  clearDraft: (key: string) => void;
  hasDraft: (key: string) => boolean;
};
 
/**
 * useDraftStore
 * --------------
 * Generic Zustand store for persisting multi-step form drafts.
 * Form-agnostic — knows nothing about any specific form's shape.
 *
 * Uses Zustand's `persist` middleware to sync to `localStorage`
 * automatically. Each draft is stored under a caller-defined key
 * so multiple forms can coexist without collision.
 *
 * Consumed via `useDraftPersistence` — not called directly in components.
 *
 * @example
 * // Reading in a hypothetical drafts list page
 * const { hasDraft, loadDraft } = useDraftStore();
 * const hasJobDraft = hasDraft("create-job-form");
 */
export const useDraftStore = create<DraftStore>()(
  persist(
    (set, get) => ({
      drafts: {},
 
      saveDraft: (key, data) =>
        set((state) => ({
          drafts: { ...state.drafts, [key]: data },
        })),
 
      loadDraft: (key) => get().drafts[key] ?? null,
 
      clearDraft: (key) =>
        set((state) => {
          const { [key]: _, ...rest } = state.drafts;
          return { drafts: rest };
        }),
 
      hasDraft: (key) => key in get().drafts,
    }),
    {
      name: "form-drafts", // localStorage key
    }
  )
);