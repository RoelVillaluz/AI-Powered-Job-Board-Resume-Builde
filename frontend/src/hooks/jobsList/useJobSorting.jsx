import { useState, useCallback } from "react";

export const useJobSorting = () => {
    const sortTypes = ['Best Match (Default)', 'A-Z', 'Z-A', 'Newest First', 'Highest Salary'];
    const [sortBy, setSortBy] = useState('Best Match (Default)');
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);

    const toggleDropdown = useCallback(() => {
        setIsDropdownVisible(prev => !prev);
    }, []);

    const handleSortButtonClick = useCallback((e, type) => {
        e.stopPropagation();
        setSortBy(type);
        setIsDropdownVisible(false);
    }, []);

    return {
        sortBy,
        setSortBy,
        sortTypes,
        isDropdownVisible,
        setIsDropdownVisible,
        toggleDropdown,
        handleSortButtonClick
    };
};