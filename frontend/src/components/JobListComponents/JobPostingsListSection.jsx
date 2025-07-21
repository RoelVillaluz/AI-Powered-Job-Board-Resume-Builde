import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useJobFilters } from "../../contexts/JobsListContext";
import JobPostingCard from "../JobPostingCard";
import { useAuth } from "../../contexts/AuthProvider";
import { useJobSortDropdown } from "../../hooks/jobs/useJobSortDropdown";
import { useJobSorting } from "../../hooks/jobs/useJobSorting";

function JobPostingsListSection() {
    const { user } = useAuth();
    const { filteredJobs } = useJobFilters();

    const sortButtonClickedRef = useRef(false); 

    const { dropdownRef, isDropdownVisible, setIsDropdownVisible, toggleDropdown } = useJobSortDropdown(sortButtonClickedRef);
    const { sortedJobs, sortTypes, handleSortButtonClick, currentSortType } = useJobSorting(filteredJobs, setIsDropdownVisible, sortButtonClickedRef);

    return (
        <section id="job-posting-list">
            <header>
                <h2>Recommended jobs <span className="filtered-jobs-count">{filteredJobs.length}</span></h2>
                <div className="sorter" ref={dropdownRef}>
                    <h4>Sort by: <span className="sort-type">{currentSortType}</span></h4>
                    <button className="sort-toggle" onClick={() => toggleDropdown()} aria-label="Toggle sort options">
                        <i className="fa-solid fa-sort"></i>
                    </button>
                    <ul style={{ display: isDropdownVisible ? 'flex': 'none' }}>
                        {sortTypes.map((type, index) => (
                            <li key={index} className={type === currentSortType ? 'active': ''}>
                                <button onClick={(e) => handleSortButtonClick(e, type)}>{type}</button>
                                {type === currentSortType && (
                                    <i className="fa-solid fa-check"></i>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </header>
            <ul>
                {sortedJobs.map((job) => (
                    <JobPostingCard job={job} user={user} key={job._id}/>
                ))}
            </ul>
        </section>
    );
}

export default JobPostingsListSection