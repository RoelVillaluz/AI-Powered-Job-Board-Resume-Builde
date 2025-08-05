import { useState, useImperativeHandle, forwardRef, useMemo } from "react"
import { useJobFilters } from "../contexts/JobsListContext";
import { DATE_FILTER_MAP } from "../../../backend/constants";

const FilterSidebar = forwardRef((props, ref) => {
    const { filters, filterTypes, handleFilterChange, handleResetFilters, allResumeSkills } = useJobFilters();
    const [hiddenSections, setHiddenSections] = useState([]);

    const toggleVisibility = (section) => {
        setHiddenSections((prevState) => ({
            ...prevState,
            [section]: !prevState[section]
        }))
    }

    useImperativeHandle(ref, () => ({
        handleFilterChange
    }))

    const DATE_OPTIONS = ['Anytime', 'Today', 'This Week', 'This Month', 'Last 3 Months']

    const currentDateFilter = useMemo(() => {
        return DATE_FILTER_MAP[filters.datePosted] || 'Anytime';
    }, [filters.datePosted]);

    const dateDropdownOptions = DATE_OPTIONS.filter(o => o !== currentDateFilter);


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
                            <select
                                name="datePosted"
                                id="date-select"
                                value={currentDateFilter}
                                onChange={(e) => handleFilterChange("datePosted", e.target.value)}
                            >
                                {DATE_OPTIONS.map((option, index) => (
                                    <option value={option} key={index}>{option}</option>
                                ))}
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

                <li className="filter-category">
                    <h4>Has Questions</h4>
                    <ul className="checkbox-list">
                        <li>
                            <input
                                type="checkbox"
                                value={filters.hasQuestions}
                                onChange={() => handleFilterChange("hasQuestions")}
                            />
                            <label htmlFor="">Has Questions</label>
                        </li>
                    </ul>
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