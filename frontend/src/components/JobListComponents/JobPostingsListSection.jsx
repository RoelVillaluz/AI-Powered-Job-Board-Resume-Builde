import { useEffect, useRef } from "react";
import { VirtuosoGrid } from "react-virtuoso";
import { useJobInfiniteScroll } from "../../hooks/jobsList/useJobInfiniteScroll";  
import JobPostingCard, { JobPostingCardSkeleton } from "./JobPostingCard";
import JobSorter from "./JobSorter";
import { useAuthStore } from "../../stores/authStore";
import { useResumeStore } from "../../stores/resumeStore";

function JobPostingsListSection({ onShowModal }) {
    const user = useAuthStore(state => state.user);  // Fetch user from Zustand
    const currentResume = useResumeStore(state => state.currentResume); // Fetch resume from Zustand 
    const { jobs, hasMoreJobs, loading, loadMoreJobs } = useJobInfiniteScroll();  // Use the updated infinite scroll hook

    console.log('Jobs: ', jobs)
    console.log('Loading: ', loading)
    console.log('Has more jobs: ', hasMoreJobs)
    

    // const {
    //     sortBy,
    //     sortTypes,
    //     isDropdownVisible,
    //     setIsDropdownVisible,
    //     toggleDropdown,
    //     handleSortButtonClick
    // } = useJobFilters();

    // const dropdownRef = useRef(null);

    // useEffect(() => {
    //     const handleClickOutside = (event) => {
    //         if (
    //             dropdownRef.current &&
    //             !dropdownRef.current.contains(event.target)
    //         ) {
    //             setIsDropdownVisible(false);
    //         }
    //     };

    //     document.addEventListener("mousedown", handleClickOutside);
    //     return () =>
    //         document.removeEventListener("mousedown", handleClickOutside);
    // }, [setIsDropdownVisible]);

    const totalCount = hasMoreJobs ? jobs.length + 6 : jobs.length;

    return (
        <section id="job-posting-list">
            <header>
                <h2>
                    Job listings{" "}
                    <span className="filtered-jobs-count">{jobs.length}</span>
                </h2>
            </header>
            {/* <header>
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
            </header> */}

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
                        loadMoreJobs();  // Trigger loading more jobs
                    }
                }}
            />
        </section>
    );
}

export default JobPostingsListSection;
