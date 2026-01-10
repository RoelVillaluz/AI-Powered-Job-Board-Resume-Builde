import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axios from 'axios';
import { BASE_API_URL } from '../config/api.js';

export const useJobStore = create(
    devtools((set) => ({
        selectedJobId: null,
        activeFilters: {},
        setSelectedJobId: (id) => set({ selectedJobId: id }),
        setFilters: (filters) => set({ activeFilters: filters }),
        clearJobUI: () =>
        set({
            selectedJobId: null,
            activeFilters: {},
        }),
    }), { name: 'JobStore' })
)