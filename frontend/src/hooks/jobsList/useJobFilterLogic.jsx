
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { INITIAL_FILTERS } from "../../../../backend/constants";
import { createFilterTypes, filterJobs, updateApplicationStatus, updateArrayFilter, updateDatePostedFilter, updateMinMatchScore, updateSalaryFilter, updateStringFilter } from "../../utils/filterUtils";

export const useJobFilterLogic = (allResumeSkills, allJobs, user) => {
    const filterRef = useRef(null);
    const [filters, setFilters] = useState(INITIAL_FILTERS);

    const handleFilterChange = useCallback((filterType, value, key = null) => {
        setFilters((prevFilters) => {
            switch (filterType) {
                case 'minMatchScore':
                    return updateMinMatchScore(prevFilters, value);

                case 'salary': 
                    if (key) {
                        return updateSalaryFilter(prevFilters, key, value)
                    }
                    return prevFilters

                case 'jobTitle':
                case 'location':
                    return updateStringFilter(prevFilters, filterType, value)

                case 'applicationStatus':
                    return updateApplicationStatus(prevFilters, value)
                case 'hasQuestions':
                    return {
                        ...prevFilters,
                        hasQuestions: !prevFilters.hasQuestions
                    };
                case 'datePosted':
                    return updateDatePostedFilter(prevFilters, value)
                default:
                    return updateArrayFilter(prevFilters, filterType, value)
            }
        })
    }, []);

    const handleResetFilters = useCallback(() => {
        setFilters(INITIAL_FILTERS)
    })

    const filterTypes = useMemo(() => 
        createFilterTypes(allResumeSkills), 
        [allResumeSkills]
    );

    const filteredJobs = useMemo(() => {
        return filterJobs(allJobs, filters, user);
    }, [allJobs, filters, user]);

    return {
        filters,
        setFilters,
        handleFilterChange,
        handleResetFilters,
        filterTypes,
        filteredJobs,
        filterRef
    };
}