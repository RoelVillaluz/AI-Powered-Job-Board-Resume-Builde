/**
 * Collapsible checkbox filter section used in the job filter sidebar.
 *
 * Supports both:
 * - Array-based filters (e.g. skills, job type)
 * - Object-based filters (e.g. application status flags)
 *
 * The component determines how to read `selectedValues` automatically
 * based on whether it is an array or an object.
 *
 * @example <caption>Array-based filter (Skills)</caption>
 * const choices = ['React', 'Node', 'Python'];
 * const selectedValues = ['React', 'Python'];
 *
 * <CollapsibleCheckboxFilter
 *   title="Skills"
 *   choices={choices}
 *   selectedValues={selectedValues}
 *   onChange={(skill) => toggleSkill(skill)}
 *   isHidden={false}
 *   onToggle={toggleVisibility}
 * />
 *
 * @example <caption>Object-based filter (Application Status)</caption>
 * const choices = ['applied', 'interviewing', 'offered'];
 * const selectedValues = {
 *   applied: true,
 *   interviewing: false,
 *   offered: true
 * };
 *
 * @param {Object} props
 * @param {string} props.title
 *   Section title displayed in the filter sidebar
 * @param {string[]} props.choices
 *   List of selectable options rendered as checkboxes
 * @param {string[]|Object<string, boolean>} props.selectedValues
 *   Currently selected values:
 *   - Array for multi-select filters
 *   - Object map for toggle-based filters
 * @param {(value: string) => void} props.onChange
 *   Callback fired when a checkbox is toggled
 * @param {boolean} props.isHidden
 *   Controls whether the checkbox list is collapsed
 * @param {() => void} props.onToggle
 *   Callback fired when the section header is clicked
 *
 * @returns {JSX.Element}
 *   Rendered collapsible filter section
 */
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