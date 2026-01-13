import { useEffect, useState, useRef } from "react";
import { useJobStore } from "../../stores/jobStore"

export const useSortDropdown = () => {
    const { sortBy, setSortBy } = useJobStore();
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);

    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.containts(event.target)) {
                setIsDropdownVisible(false);
            };
            
            document.addEventListener('mousedown', handleClickOutside);

            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [setIsDropdownVisible])

    const toggleDropdown = () => {
        setIsDropdownVisible(prev => !prev)
    }

    const handleSortSelect = (option) => {
        setSortBy(option);
        setIsDropdownVisible(false);
    }

    return {
        sortBy,
        isDropdownVisible,
        dropdownRef,
        toggleDropdown,
        handleSortSelect,
    };
}