export const MatchScoreFilter = ({ value, onChange }) => {
    return (
        <>
            <h4>Match Score</h4>
                <div className="range-slider">
                    <label htmlFor="match-score-slider" className="sr-only">Match Score</label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={value}
                        onChange={(e) => onChange("minMatchScore", e.target.value)}
                        className="slider"
                        id="match-score-slider"
                    />
                    <div
                        className="custom-thumb"
                        style={{
                            left: `calc(${Math.max(value, 15)}% - 15px)`, 
                        }}
                    >
                    {value}
                </div>
            </div>
        </>
    )
}

export default MatchScoreFilter