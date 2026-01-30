import { useJobStore } from "../../stores/jobStore";

/**
 * Custom hook that provides handler functions for managing job filters.
 * Encapsulates the logic for updating different types of filters in the job store.
 * 
 * @returns {Object} Filter handler functions
 * @returns {Function} returns.handleSalaryChange - Updates salary min/max values
 * @returns {Function} returns.handleArrayFilterChange - Toggles values in array filters
 * @returns {Function} returns.handleApplicationStatusChange - Toggles application status flags
 * @returns {Function} returns.handleSimpleFilterChange - Updates simple string/value filters
 * @returns {Function} returns.handleNumericFilterChange - Updates numeric filters with parsing
 * @returns {Function} returns.handleBooleanToggle - Toggles boolean filter values
 * 
 * @example
 * const { handleSalaryChange, handleArrayFilterChange } = useFilterHandlers();
 * handleSalaryChange('50000', 'min');
 * handleArrayFilterChange('jobType', 'Full-Time');
 */
export const useFilterHandlers = () => {
    const { activeFilters, updateFilter } = useJobStore();

    /**
     * Updates the salary filter's min or max value.
     * 
     * @param {string} value - The salary amount as a string
     * @param {'min'|'max'} key - Whether to update min or max salary
     */
    const handleSalaryChange = (value, key) => {
        updateFilter('salary', {
            ...activeFilters.salary,
            amount: {
                ...activeFilters.salary.amount,
                [key]: value ? parseInt(value) : null
            }
        });
    };

    /**
     * Toggles a value in an array-based filter (jobType, skills, industry, etc.).
     * If the value exists, it's removed; if it doesn't exist, it's added.
     * 
     * @param {string} filterType - The filter key (e.g., 'jobType', 'skills')
     * @param {string} value - The value to toggle in the array
     */
    const handleArrayFilterChange = (filterType, value) => {
        const currentArray = activeFilters[filterType] || [];
        const newArray = currentArray.includes(value)
            ? currentArray.filter(item => item !== value)
            : [...currentArray, value];
        updateFilter(filterType, newArray);
    };

    /**
     * Toggles an application status flag.
     * 
     * @param {string} value - The status to toggle (e.g., 'applied', 'interviewing')
     */
    const handleApplicationStatusChange = (value) => {
        updateFilter('applicationStatus', {
            ...activeFilters.applicationStatus,
            [value]: !activeFilters.applicationStatus[value]
        });
    };

    /**
     * Updates a simple filter with the provided value directly.
     * 
     * @param {string} filterType - The filter key to update
     * @param {any} value - The new value for the filter
     */
    const handleSimpleFilterChange = (filterType, value) => {
        updateFilter(filterType, value);
    };

    /**
     * Updates a numeric filter, parsing the value as an integer.
     * Falls back to 0 if parsing fails.
     * 
     * @param {string} filterType - The filter key to update
     * @param {string|number} value - The numeric value to set
     */
    const handleNumericFilterChange = (filterType, value) => {
        if (typeof value === "number" && !isNaN(value)) {
            useJobStore.getState().updateFilter(filterType, value);
        }
    };

    /**
     * Toggles a boolean filter between true and false.
     * 
     * @param {string} filterType - The filter key to toggle
     */
    const handleBooleanToggle = (filterType) => {
        updateFilter(filterType, !activeFilters[filterType]);
    };

    return {
        handleSalaryChange,
        handleArrayFilterChange,
        handleApplicationStatusChange,
        handleSimpleFilterChange,
        handleNumericFilterChange,
        handleBooleanToggle,
    };
};