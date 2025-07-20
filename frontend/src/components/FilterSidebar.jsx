import { useState, useEffect, useImperativeHandle, forwardRef } from "react"
import { useJobFilters } from "../contexts/JobsListContext";

const FilterSidebar = forwardRef(({ user, resumes, filters, setFilters, setAllResumeSkills }, ref) => {
    const { filterTypes, handleFilterChange } = useJobFilters();
    const [hiddenSections, setHiddenSections] = useState([]);

    const combineResumeSkills = () => {
        if (!Array.isArray(resumes)) return;

        const resumeSkills = resumes
            .flatMap((resume) => Array.isArray(resume.skills)
            ? resume.skills.map((skill) => skill.name)
            : []
            );

        const uniqueSkills = [...new Set(resumeSkills)];

        setAllResumeSkills(uniqueSkills);
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

    useEffect(() => {
        combineResumeSkills()
    }, [resumes])

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
                                    value={filters.salary.amount.min ?? ''} 
                                    onChange={(e) => handleFilterChange("salary", e.target.value, "min")}/>
                            </div>
                            <div>
                                <label htmlFor="max-salary">MAX</label>
                                <input type="number" 
                                    id="max-salary"
                                    value={filters.salary.amount.max ?? ''}
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