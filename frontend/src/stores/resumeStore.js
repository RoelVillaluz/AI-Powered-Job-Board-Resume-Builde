import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useResumeStore = create(
  devtools(
    (set) => ({
      // UI state only
      currentResume: null,

      // Actions
      setCurrentResume: (resume) => set({ currentResume: resume }),
      clearCurrentResume: () => set({ currentResume: null }),
    }),
    { name: 'ResumeStore' }
  )
)