import { useEffect, useRef } from "react";
import { VirtuosoGrid } from "react-virtuoso";
import { useJobsState, useJobFilters } from "../../contexts/JobsListContext";
import { useAuth } from "../../contexts/AuthProvider";
import JobPostingCard, { JobPostingCardSkeleton } from "./JobPostingCard";
import JobSorter from "./JobSorter";

function JobPostingsListSection({ currentResume, onShowModal }) {
    const { user } = useAuth();
    const { jobs, hasMoreJobs, loading, loadMoreJobs } = useJobsState();
    const {
        sortBy,
        sortTypes,
        isDropdownVisible,
        setIsDropdownVisible,
        toggleDropdown,
        handleSortButtonClick
    } = useJobFilters();

    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsDropdownVisible(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [setIsDropdownVisible]);

    const totalCount = hasMoreJobs ? jobs.length + 6 : jobs.length;

    return (
        <section id="job-posting-list">
            <header>
                <h2>
                    Job listings{" "}
                    <span className="filtered-jobs-count">{jobs.length}</span>
                </h2>

                <JobSorter
                    currentSortType={sortBy}
                    sortTypes={sortTypes}
                    isDropdownVisible={isDropdownVisible}
                    dropdownRef={dropdownRef}
                    toggleDropdown={toggleDropdown}
                    handleSortButtonClick={handleSortButtonClick}
                />
            </header>

            <VirtuosoGrid
                style={{ height: "900px", width: "100%" }}
                totalCount={totalCount}
                listClassName="job-list-grid"
                increaseViewportBy={{ top: 200, bottom: 600 }}
                itemContent={(index) => {
                    const job = jobs[index];

                    return job ? (
                        <JobPostingCard
                            key={job._id}
                            job={job}
                            user={user}
                            resume={currentResume}
                            onShowModal={onShowModal}
                        />
                    ) : (
                        <JobPostingCardSkeleton
                            key={`skeleton-${index}`}
                        />
                    );
                }}
                endReached={() => {
                    if (hasMoreJobs && !loading) {
                        loadMoreJobs();
                    }
                }}
            />
        </section>
    );
}

export default JobPostingsListSection;
