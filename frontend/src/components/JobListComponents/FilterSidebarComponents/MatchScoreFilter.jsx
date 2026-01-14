import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "../../../hooks/useDebounce";

export const MatchScoreFilter = ({ value, onChange }) => {
    const [localValue, setLocalValue] = useState(value);
    const debouncedValue = useDebounce(localValue, 300);

    // Update the store when debounced value changes
    useEffect(() => {
        onChange(debouncedValue);
    }, [debouncedValue]); // Only depend on debouncedValue, not onChange

    // Update local state when external value prop changes
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    return (
        <>
            <h4>Match Score</h4>
            <div className="range-slider">
                <label htmlFor="match-score-slider" className="sr-only">Match Score</label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={localValue}
                    onChange={(e) => setLocalValue(Number(e.target.value))}
                    className="slider"
                    id="match-score-slider"
                />
                <div
                    className="custom-thumb"
                    style={{
                        left: `calc(${Math.max(localValue, 15)}% - 15px)`,
                    }}
                >
                    {localValue}
                </div>
            </div>
        </>
    );
};

export default MatchScoreFilter;