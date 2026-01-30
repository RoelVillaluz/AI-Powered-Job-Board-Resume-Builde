import { DATE_OPTIONS_MAP } from "../../../../../backend/constants"

const DatePostedFilter = ({ value, onChange }) => {
    return (
        <div>
            <h4>Date Posted</h4>
            <div className="select-wrapper">
                <label htmlFor="date-select" className="sr-only">Date Posted</label>
                <select
                    name="datePosted"
                    id="date-select"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                >
                    {Object.keys(DATE_OPTIONS_MAP).map((option) => (
                    <option value={option} key={option}>{option}</option>
                    ))}
                </select>
                <i className="fa-solid fa-angle-down"></i>
            </div>
        </div>
    )
}

export default DatePostedFilter