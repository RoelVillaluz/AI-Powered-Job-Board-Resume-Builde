import { useState, useMemo, useRef, useEffect } from "react";
import { useJobFilters } from "../../contexts/JobsListContext";
import JobPostingCard from "../JobPostingCard";
import { useAuth } from "../../contexts/AuthProvider";

function JobPostingsListSection() {
    const { user } = useAuth();
    const { filteredJobs } = useJobFilters();

    const sortButtonClickedRef = useRef(false);
    const sortTypes = ['Best Match (Default)', 'A-Z', 'Z-A', 'Newest First', 'Highest Salary']
    const [currentSortType, setCurrentSortType] = useState('Best Match (Default)')
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const dropdownRef = useRef(null);

    const handleSortButtonClick = (e, type) => {
        e.stopPropagation();
        // Set the ref to true to indicate a sort button was clicked
        sortButtonClickedRef.current = true;
        setCurrentSortType(type);
        setIsDropdownVisible(false);
        console.log("Sort type changed to:", type);
    }

    const getSortedJobs = useMemo(() => {
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

    // Modified handleClickOutside to respect sort button clicks
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sortButtonClickedRef.current) {
                sortButtonClickedRef.current = false;
                return;
            }
            
            // Otherwise proceed with normal outside click handling
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownVisible(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);  

    return (
        <section id="job-posting-list">
            <header>
                <h2>Recommended jobs <span className="filtered-jobs-count">{filteredJobs.length}</span></h2>
                <div className="sorter" ref={dropdownRef}>
                    <h4>Sort by: <span className="sort-type">{currentSortType}</span></h4>
                    <button className="sort-toggle" onClick={(e) => {
                        e.stopPropagation();  
                        setIsDropdownVisible(prev => !prev);
                    }} aria-label="Toggle sort options">
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
                {getSortedJobs.map((job) => (
                    <JobPostingCard job={job} user={user} key={job._id}/>
                ))}
            </ul>
        </section>
    )
}

export default JobPostingsListSection