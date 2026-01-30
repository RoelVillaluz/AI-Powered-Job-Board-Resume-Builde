// stores/jobStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { INITIAL_FILTERS } from '../../../backend/constants';

/**
 * @typedef {Object} SalaryFilter
 * @property {Object} amount
 * @property {number|null} amount.min - Minimum salary
 * @property {number|null} amount.max - Maximum salary
 */

/**
 * @typedef {Object} JobFilters
 * @property {string} jobTitle - Job title search query
 * @property {string} location - Location search query
 * @property {string[]} jobType - Selected job types (e.g., 'Full-Time', 'Part-Time')
 * @property {string[]} experienceLevel - Selected experience levels (e.g., 'Entry', 'Senior')
 * @property {string[]} skills - Selected skills to filter by
 * @property {string[]} industry - Selected industries
 * @property {SalaryFilter} salary - Salary range filter
 * @property {number} minMatchScore - Minimum match score (0-100)
 * @property {boolean} hasQuestions - Whether to show only jobs with questions
 * @property {string} datePosted - Date posted filter (e.g., 'Anytime', 'Today')
 * @property {Object.<string, boolean>} applicationStatus - Application status flags
 */

/**
 * Zustand store for managing job-related state including filters, sorting, and selection.
 * 
 * @typedef {Object} JobStore
 * @property {string|null} selectedJobId - Currently selected job ID
 * @property {JobFilters} activeFilters - Current active filters
 * @property {string} sortBy - Current sort option (e.g., 'Newest First')
 * @property {Function} setSelectedJobId - Updates the selected job ID
 * @property {Function} setFilters - Replaces all filters with new values
 * @property {Function} setSortBy - Updates the sort option
 * @property {Function} updateFilter - Updates a single filter by key
 * @property {Function} resetFilters - Resets all filters to default values
 * @property {Function} clearJobUI - Clears selected job and resets filters
 */
export const useJobStore = create(
    devtools((set) => ({
        // State
        selectedJobId: null,
        activeFilters: INITIAL_FILTERS,
        sortBy: 'Best Match (Default)',
        
        /**
         * Sets the currently selected job ID.
         * @param {string|null} id - The job ID to select, or null to deselect
         */
        setSelectedJobId: (id) => set({ selectedJobId: id }),
        
        /**
         * Replaces the entire filter object with new values.
         * Merges provided filters with defaults.
         * @param {Partial<JobFilters>} filters - New filter values
         */
        setFilters: (filters) => set({ 
            activeFilters: { ...INITIAL_FILTERS, ...filters } 
        }),
        
        /**
         * Updates the sort option for job listings.
         * @param {string} sortBy - Sort option (e.g., 'Newest First', 'Best Match')
         */
        setSortBy: (sortBy) => set({ sortBy }),
        
        /**
         * Updates a single filter by key.
         * @param {keyof JobFilters} key - The filter key to update
         * @param {any} value - The new value for the filter
         */
        updateFilter: (key, value) => set((state) => ({
            activeFilters: {
                ...state.activeFilters,
                [key]: value
            }
        })),
        
        /**
         * Resets all filters to their default values.
         */
        resetFilters: () => set({ activeFilters: INITIAL_FILTERS }),
        
        /**
         * Clears the job UI state by deselecting the job and resetting filters.
         */
        clearJobUI: () => set({
            selectedJobId: null,
            activeFilters: INITIAL_FILTERS,
        }),
    }), { name: 'JobStore' })
);