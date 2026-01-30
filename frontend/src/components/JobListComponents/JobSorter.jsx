import { SORTING_CHOICES } from "../../../../backend/constants"
import { useSortDropdown } from "../../hooks/jobsList/useSortDropdown"

const JobSorter = () => { 
    const { sortBy, isDropdownVisible, dropdownRef, toggleDropdown, handleSortSelect } = useSortDropdown();

    return (
        <div className="sorter" ref={dropdownRef}>
            <h4>Sort by: <span className="sort-type">{sortBy}</span></h4>
            <button className="sort-toggle" onClick={() => toggleDropdown()} aria-label="Toggle sort options">
                <i className="fa-solid fa-sort"></i>
            </button>
            <ul style={{ display: isDropdownVisible ? 'flex': 'none' }}>
                {SORTING_CHOICES.map((type, index) => (
                    <li key={index} className={type === sortBy ? 'active': ''}>
                        <button onClick={() => handleSortSelect(type)}>{type}</button>
                        {type === sortBy && (
                            <i className="fa-solid fa-check"></i>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default JobSorter