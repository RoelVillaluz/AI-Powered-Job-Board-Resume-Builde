import { useState } from "react";


/**
 * Custom hook for managing the collapsed/expanded state of multiple sections.
 *
 * Useful for UI components like filter sidebars, accordions, or any
 * collapsible sections where you need to track visibility individually.
 *
 * Each section's visibility is tracked by a key in an object,
 * with `true` indicating the section is hidden and `false` (or undefined)
 * indicating it is visible.
 *
 * @example
 * const { hiddenSections, toggleVisibility } = useToggleSections();
 *
 * // Toggle "Skills" section
 * toggleVisibility("Skills");
 *
 * // Check if "Skills" section is hidden
 * if (hiddenSections["Skills"]) {
 *   console.log("Skills section is collapsed");
 * }
 *
 * @returns {Object} Returns the visibility state and toggle function
 * @returns {Object<string, boolean>} returns.hiddenSections
 *   Object mapping section names to their hidden state
 * @returns {(section: string) => void} returns.toggleVisibility
 *   Function to toggle the hidden state of a given section by name
 */
export const useToggleSections = () => {
    const [hiddenSections, setHiddenSections] = useState({});

    const toggleVisibility = (section) => {
        setHiddenSections((prevState) => ({
            ...prevState,
            [section]: !prevState[section]
        }));
    };

    return { hiddenSections, toggleVisibility }
}