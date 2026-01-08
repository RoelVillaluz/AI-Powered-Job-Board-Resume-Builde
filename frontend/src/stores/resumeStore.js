import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axios from 'axios';
import { BASE_API_URL } from '../config/api.js';

export const useResumeStore = create(
    devtools(
        (set, get) => ({
            // State
            resumes: [],
            currentResume: null,
            isLoading: false,
            error: null,

            // Actions
            fetchResumes: async (userId) => {
                if (!userId) {
                    console.warn('fetchResumes called without userId');
                    return;
                }

                set({ isLoading: true, error: null })

                try {
                    const { data } = await axios.get(`${BASE_API_URL}/resumes/user/${userId}`)

                    set({
                        resumes: data.data,
                        currentResume: data.data[0] || null,
                        isLoading: false
                    })
                } catch (error) {
                    console.error('Error fetching resumes', error)
                    set({
                        isLoading: false,
                        error: error.message
                    })
                }
            },

            setCurrentResumes: (resume) => set({ currentResume: resume }),

            clearResumes: () =>
                set({
                resumes: [],
                currentResume: null,
                error: null,
            }),
        }),
        { name: 'ResumeStore' }
    )
)