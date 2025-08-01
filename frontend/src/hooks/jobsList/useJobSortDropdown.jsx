import { useState, useRef, useEffect, useCallback } from "react";

export const useJobSortDropdown = (sortButtonClickedRef) => {
    const dropdownRef = useRef(null);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);

    const toggleDropdown = useCallback((e) => {
        e?.stopPropagation();  
        setIsDropdownVisible(prev => !prev);
    }, [])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sortButtonClickedRef?.current) {
                sortButtonClickedRef.current = false;
                return;
            }
            
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownVisible(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [sortButtonClickedRef]);

    return { dropdownRef, isDropdownVisible, setIsDropdownVisible, toggleDropdown };
}