function JobSorter({ 
    currentSortType, 
    sortTypes, 
    isDropdownVisible, 
    dropdownRef, 
    toggleDropdown, 
    handleSortButtonClick 
}) {
    

    return (
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
    )
}

export default JobSorter