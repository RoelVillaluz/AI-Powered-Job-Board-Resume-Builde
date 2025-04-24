import { useState, useImperativeHandle, forwardRef } from "react"
import { industryChoices } from "../../../backend/constants";

const FilterSidebar = forwardRef(({ filters, setFilters, allResumeSkills }, ref) => {
    const [hiddenSections, setHiddenSections] = useState([]);

    const filterTypes =  {
        // filterType = actual jobPosting fields (jobType, experienceLevel) for filtering
        "Workplace Type": {
            "choices": ["Remote", "On-Site", "Hybrid"]
        },
        "Working Schedule": {
            "choices": ['Full-Time', 'Part-Time', 'Contract', 'Internship'],
            "filterType": "jobType"
        },
        "Experience Level": {
            "choices": ['Intern', 'Entry', 'Mid-Level', 'Senior'],
            "filterType": "experienceLevel"
        },
        "Your Skills": {
            "choices": allResumeSkills,
            "filterType": "skills"
        },
        "Application Status": {
            "choices": ['saved', 'applied'],
            "filterType": "applicationStatus"
        },
        "Industry": {
            "choices": [...Object.keys(industryChoices)],
            "filterType": "industry"
        }
    }

    const handleFilterChange = (filterType, value, key = null) => {
        setFilters((prevFilters) => {
            if (filterType === 'minMatchScore') {
                return {
                    ...prevFilters,
                    minMatchScore: parseInt(value)
                }
            } else if (filterType === 'salary' && key) {
                return {
                    ...prevFilters,
                    salary: {
                        ...prevFilters.salary,
                        [key]: value !== null ? parseInt(value) : null
                    }
                }
            } else if (filterType === 'jobTitle' || filterType === 'location') {
                // Handle string values for search
                return {
                    ...prevFilters,
                    [filterType]: value
                };
            } else if (filterType === 'applicationStatus') {
                return {
                    ...prevFilters,
                    applicationStatus: {
                        ...prevFilters.applicationStatus,
                        [value]: !prevFilters.applicationStatus[value]
                    }
                }
            }
    

            const updatedFilterValues = prevFilters[filterType].includes(value)
                ? prevFilters[filterType].filter(item => item !== value)
                : [...prevFilters[filterType], value]

            return { ...prevFilters, [filterType]: updatedFilterValues };
        })
    } 

    const handleResetFilters = () => {
        setFilters({
            jobType: [],
            experienceLevel: [],
            skills: [],
            minMatchScore: 0,
            applicationStatus: {
                saved: false,
                applied: false,
            }
        })
    }

    const toggleVisibility = (section) => {
        setHiddenSections((prevState) => ({
            ...prevState,
            [section]: !prevState[section]
        }))
    }

    useImperativeHandle(ref, () => ({
        handleFilterChange
    }))

    return (
        <aside className="filter-sidebar">
            <header>
                <h3>Filters</h3>
                <button type="reset" onClick={() => handleResetFilters()}>Clear All</button>
            </header>
            <ul className="filter-category-list">

                <li>
                    <div className="filter-category">
                        <h4>Date Posted</h4>
                        <div className="select-wrapper">
                            <select name="" id="date-select">$
                                <option value="">Anytime</option>
                                <option value="">This Month</option>
                            </select>
                            <i className="fa-solid fa-angle-down"></i>
                        </div>
                    </div>
                </li>

                <li>
                    <div className="filter-category">
                        <h4>Salary Range</h4>
                        <div className="min-max-container">
                            <div>
                                <label htmlFor="min-salary">MIN</label>
                                <input type="number" 
                                    id="min-salary"
                                    value={filters.salary.min ?? ''} 
                                    onChange={(e) => handleFilterChange("salary", e.target.value, "min")}/>
                            </div>
                            <div>
                                <label htmlFor="max-salary">MAX</label>
                                <input type="number" 
                                    id="max-salary"
                                    value={filters.salary.max ?? ''}
                                    onChange={(e) => handleFilterChange("salary", e.target.value, "max")}/>
                            </div>
                        </div>
                    </div>
                </li>

                <li className="filter-category">
                    <h4>Match Score</h4>
                    <div className="range-slider">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={filters.minMatchScore}
                            onChange={(e) => handleFilterChange("minMatchScore", e.target.value)}
                            className="slider"
                        />
                        <div
                            className="custom-thumb"
                            style={{
                                left: `calc(${Math.max(filters.minMatchScore, 15)}% - 15px)`, 
                            }}
                        >
                            {filters.minMatchScore}
                        </div>
                    </div>
                </li>

                <li>
                    {Object.keys(filterTypes).map((section) => (
                        <div className="filter-category" key={section}>
                            <div className="wrapper">
                                <h4>{section}</h4>
                                <i className={`fa-solid fa-angle-${!hiddenSections[section] ? 'up' : 'down'}`} onClick={() => toggleVisibility(section)}></i>
                            </div>
                            {!hiddenSections[section] && (
                                <ul className="checkbox-list">
                                    {filterTypes[section].choices.map((choice, index) => (
                                        <li key={index}>
                                            <input
                                                type="checkbox"
                                                id={`checkbox-${choice}`}
                                                checked={
                                                    filterTypes[section].filterType === 'applicationStatus'
                                                        ? filters.applicationStatus[choice] || false
                                                        : filters[filterTypes[section].filterType]?.includes(choice) || false
                                                }
                                                onChange={() => handleFilterChange(filterTypes[section].filterType, choice)}
                                            />
                                            <label htmlFor={`checkbox-${choice}`}>{choice.charAt(0).toUpperCase() + choice.slice(1)}</label>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </li>

            </ul>
        </aside>
    )
})

export default FilterSidebar