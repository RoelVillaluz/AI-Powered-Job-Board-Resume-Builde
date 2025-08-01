import { useState, useMemo, useRef, useCallback } from "react";
import { SORTING_CHOICES } from "../../../../backend/constants";

export const useJobSorting = (filteredJobs = [], setIsDropdownVisible, sortButtonClickedRef) => {
    const sortTypes = SORTING_CHOICES
    const [currentSortType, setCurrentSortType] = useState('Best Match (Default)')

    const handleSortButtonClick = useCallback(((e, type) => {
        e.stopPropagation();
        // Set the ref to true to indicate a sort button was clicked
        sortButtonClickedRef.current = true;
        setCurrentSortType(type);
        setIsDropdownVisible?.(false);
        console.log("Sort type changed to:", type);
    }), [])

    const sortedJobs = useMemo(() => {
        switch (currentSortType) {
            case "A-Z":
                return [...filteredJobs].sort((a, b) => a.title.localeCompare(b.title))
            case "Z-A":
                return [...filteredJobs].sort((a, b) => b.title.localeCompare(a.title))
            case "Newest First":
                return [...filteredJobs].sort((a, b) => b.postedAt.localeCompare(a.postedAt))
            case "Highest Salary":
                return [...filteredJobs].sort((a, b) => b.salary.amount - a.salary.amount)
            default:
                return filteredJobs // no need to explicitly sort by similarity, already done in the api backend
        }
    }, [currentSortType, filteredJobs])

    return { sortedJobs, sortTypes, handleSortButtonClick, currentSortType, setCurrentSortType, sortButtonClickedRef }
}