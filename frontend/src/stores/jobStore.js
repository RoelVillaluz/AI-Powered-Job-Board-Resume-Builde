import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axios from 'axios';
import { BASE_API_URL } from '../config/api.js';

export const useJobStore = create(
    devtools(
        (set) => ({
            // State
            jobPostings: [],
            jobRecommendations: [],
            isLoading: false,
            error: null,

            // Actions
            fetchJobPostings: async () => {
                set({ isLoading: true, error: null });

                try {
                    const { data } = await axios.get(`${BASE_API_URL}/job-postings`)

                    set({
                        jobPostings: data.data,
                        isLoading: false
                    })
                } catch (error) {
                    console.error('Error fetching job postings:', error);
                    set({ 
                        error: error.message,
                        isLoading: false, 
                    })
                }
            },

            fetchJobRecommendations: async (userId) => {
                set({ isLoading: true, error: null });

                try {
                    const { data } = await axios.get(`${BASE_API_URL}/ai/job-recommendations/${userId}`);

                    set({
                        jobRecommendations: data.data,
                        isLoading: false
                    })
                } catch (error) {
                    console.error('Error fetching job recommendations', error)
                    set({
                        error: error.message,
                        isLoading: false
                    })
                }
            },

            clearJobs: () =>
                set({
                jobPostings: [],
                jobRecommendations: [],
                error: null,
            }),
        }),
        { name: 'JobStore' }
    )
)