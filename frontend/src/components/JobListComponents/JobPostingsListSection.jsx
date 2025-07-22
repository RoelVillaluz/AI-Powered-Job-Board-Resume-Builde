import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useJobFilters } from "../../contexts/JobsListContext";
import JobPostingCard from "../JobPostingCard";
import { useAuth } from "../../contexts/AuthProvider";
import { useJobSortDropdown } from "../../hooks/jobs/useJobSortDropdown";
import { useJobSorting } from "../../hooks/jobs/useJobSorting";
import JobSorter from "./JobSorter";

function JobPostingsListSection() {
    const { user } = useAuth();
    const { filteredJobs } = useJobFilters();
    
    const sortButtonClickedRef = useRef(false);
    
    // Sort Dropdown Hook
    const { dropdownRef, isDropdownVisible, setIsDropdownVisible, toggleDropdown } = useJobSortDropdown(sortButtonClickedRef);

    // Actual Sorting Logic Hook
    const { currentSortType, sortedJobs, sortTypes, handleSortButtonClick } = useJobSorting(filteredJobs, setIsDropdownVisible, sortButtonClickedRef);

    return (
        <section id="job-posting-list">
            <header>
                <h2>Recommended jobs <span className="filtered-jobs-count">{filteredJobs.length}</span></h2>
                <JobSorter 
                    currentSortType={currentSortType}
                    sortTypes={sortTypes}
                    isDropdownVisible={isDropdownVisible}
                    dropdownRef={dropdownRef}
                    toggleDropdown={toggleDropdown}
                    handleSortButtonClick={handleSortButtonClick}
                />
            </header>
            <ul>
                {sortedJobs.map((job) => (
                    <JobPostingCard job={job} user={user} key={job._id}/>
                ))}
            </ul>
        </section>
    );
}

export default JobPostingsListSection;