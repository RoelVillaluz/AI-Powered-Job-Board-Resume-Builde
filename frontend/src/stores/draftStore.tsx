import { create } from "zustand";
import { persist } from "zustand/middleware";
 
type DraftStore = {
  drafts: Record<string, unknown>;
  saveDraft: (key: string, data: unknown) => void;
  loadDraft: (key: string) => unknown;
  clearDraft: (key: string) => void;
  clearAllDrafts: () => void;
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
 * ## Clearing drafts on logout
 * Call `useDraftStore.getState().clearAllDrafts()` inside the auth store's
 * logout action. This resets in-memory state to `{}` and the persist
 * middleware automatically syncs the empty state to localStorage — no need
 * to call `persist.clearStorage()` separately, which would only wipe
 * localStorage while leaving the in-memory state stale.
 *
 * @example
 * const { hasDraft, loadDraft } = useDraftStore();
 * const hasJobDraft = hasDraft("create-job-form");
 */
export const useDraftStore = create<DraftStore>()(
  persist(
    (set, get) => ({
      drafts: {},

      saveDraft: (key, data) => 
        set((state) => ({
          drafts: ({ ...state.drafts, [key]: data })
        })),

      loadDraft: (key) => get().drafts[key] ?? null,

      clearDraft: (key) =>
        set((state) => {
          const { [key]: _, ...rest } = state.drafts;
          return { drafts: rest };
        }),
 
      /**
       * Wipes every draft at once. Call this on logout so no draft data
       * bleeds into the next user's session. The persist middleware syncs
       * the resulting empty `drafts: {}` to localStorage automatically.
       */
      clearAllDrafts: () => set({ drafts: {} }),
 
      hasDraft: (key) => key in get().drafts,
    }),
    {
      name: 'form-drafts'
    }
  )
)