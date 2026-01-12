const CollapsibleCheckboxFilter = ({ 
    title, 
    choices, 
    selectedValues, 
    onChange,
    isHidden,
    onToggle 
}) => (
  <div className="filter-category">
    <div className="wrapper">
        <h4>{title}</h4>
        <i 
            className={`fa-solid fa-angle-${!isHidden ? 'up' : 'down'}`} 
            onClick={onToggle}
        ></i>
        </div>
        {!isHidden && (
        <ul className="checkbox-list">
            {choices.map((choice) => {
            const isChecked = typeof selectedValues === 'object' && !Array.isArray(selectedValues)
                ? selectedValues[choice] || false
                : selectedValues?.includes(choice) || false;
            
            return (
                <li key={choice}>
                <input
                    type="checkbox"
                    id={`checkbox-${choice}`}
                    checked={isChecked}
                    onChange={() => onChange(choice)}
                />
                <label htmlFor={`checkbox-${choice}`}>
                    {choice.charAt(0).toUpperCase() + choice.slice(1)}
                </label>
                </li>
            );
            })}
        </ul>
        )}
  </div>
);

export default CollapsibleCheckboxFilter;