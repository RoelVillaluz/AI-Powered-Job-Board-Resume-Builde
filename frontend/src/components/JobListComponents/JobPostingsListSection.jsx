import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import JobPostingCard, { JobPostingCardSkeleton } from "./JobPostingCard";
import { useAuth } from "../../contexts/AuthProvider";
import { useJobSortDropdown } from "../../hooks/jobsList/useJobSortDropdown";
import { useJobSorting } from "../../hooks/jobsList/useJobSorting";
import JobSorter from "./JobSorter";
import { useJobFilters, useJobsState } from "../../contexts/JobsListContext";
import { VirtuosoGrid } from 'react-virtuoso';
import { useData } from "../../contexts/DataProvider";

function JobPostingsListSection({ currentResume, onShowModal }) {
    const { user } = useAuth();
    const { baseUrl, jobRecommendations } = useData();
    const { filteredJobs } = useJobFilters();
    const { loadMoreJobs, isLoadingMoreJobs, hasMoreJobs } = useJobsState();

    const sortButtonClickedRef = useRef(false);
    
    // Sort Dropdown Hook
    const { dropdownRef, isDropdownVisible, setIsDropdownVisible, toggleDropdown } = useJobSortDropdown(sortButtonClickedRef);

    // Actual Sorting Logic Hook
    const { currentSortType, sortedJobs, sortTypes, handleSortButtonClick } = useJobSorting(filteredJobs, setIsDropdownVisible, sortButtonClickedRef);

    // Calculate total count including placeholder skeletons
    const totalCount = hasMoreJobs ? sortedJobs.length + 6 : sortedJobs.length 

    const initialLoadDoneRef = useRef(false);

    // Initial load - only once
    useEffect(() => {
        if (!initialLoadDoneRef.current && jobRecommendations.length > 0) {
            initialLoadDoneRef.current = true;
            loadMoreJobs();
        }
    }, [jobRecommendations, loadMoreJobs]);

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
            {/* {sortedJobs.map((job) => (
                <JobPostingCard job={job} user={user} key={job._id} resume={currentResume} onShowModal={onShowModal}/>
            ))} */}
            <VirtuosoGrid
                style={{ height: '900px', width: '100%' }}
                totalCount={totalCount}
                listClassName="job-list-grid"
                increaseViewportBy={{ top: 200, bottom: 600 }} 
                itemContent={(index) => {
                    const job = sortedJobs[index]
                    
                    return job ? (
                        <JobPostingCard
                            job={job}
                            user={user}
                            resume={currentResume}
                            onShowModal={onShowModal}
                        />
                    ) : (
                        <JobPostingCardSkeleton/>
                    )
                }}
                endReached={() => {
                    console.log('End reached triggered, hasMoreJobs:', hasMoreJobs);
                    if (hasMoreJobs && !isLoadingMoreJobs) {
                        loadMoreJobs();
                    }
                }}
            />
        </section>
    );
}

export default JobPostingsListSection;