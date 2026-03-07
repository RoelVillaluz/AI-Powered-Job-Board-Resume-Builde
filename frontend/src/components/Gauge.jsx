import { useState, useEffect } from "react";

function Gauge({ value, jobProgress, messages, loading, isAnalyzing, objectName = null }) {
    const [animatedValue, setAnimatedValue] = useState(0);
    const [animatedJobProgress, setAnimatedJobProgress] = useState(0);

    // Animate the final score value
    useEffect(() => {
        if (value === null) return;
        const timeout = setTimeout(() => setAnimatedValue(value), 300);
        return () => clearTimeout(timeout);
    }, [value]);

    // Animate job progress bar while analyzing
    useEffect(() => {
        const timeout = setTimeout(() => setAnimatedJobProgress(jobProgress), 100);
        return () => clearTimeout(timeout);
    }, [jobProgress]);

    // While analyzing, gauge fills based on job progress
    // When done, gauge fills based on actual score
    const displayValue = isAnalyzing ? animatedJobProgress : animatedValue;
    const normalized = Math.min(displayValue / 100, 1);
    const rotation = `rotate(${normalized / 2}turn)`;

    return (
        <div className={`gauge ${isAnalyzing ? 'gauge--analyzing' : 'gauge--complete'}`}>
            <div className="gauge-body">
                <div
                    className="gauge-fill"
                    style={{
                        transform: rotation,
                        backgroundColor: 'black', 
                        transition: isAnalyzing
                            ? "transform 0.8s ease-out, background-color 0.3s"
                            : "transform 1.5s ease-in-out, background-color 0.5s"
                    }}
                />
                <div className="gauge-cover">
                    {isAnalyzing ? (
                        // Analyzing state
                        <>
                            <i className="fa-solid fa-brain gauge-brain-icon" />
                            <p className="gauge-progress-text">{Math.round(animatedJobProgress)}%</p>
                            <p className="gauge-status-text">
                                {messages?.overallMessage ?? 'Analyzing...'}
                            </p>
                        </>
                    ) : loading ? (
                        // Initial loading state
                        <>
                            <i className="fa-solid fa-circle-notch fa-spin" />
                            <p>Loading...</p>
                        </>
                    ) : value !== null ? (
                        // Final score state
                        <>
                            <h2>{Math.round(animatedValue)}<span>%</span></h2>
                            <p>Effectiveness</p>
                        </>
                    ) : (
                        // No score yet
                        <>
                            <i className="fa-solid fa-chart-simple" />
                            <p>No score yet</p>
                        </>
                    )}
                </div>
            </div>

            {/* Only show grade/message when fully done */}
            {!isAnalyzing && !loading && value !== null && messages && (
                <div className="gauge-message">
                    <h4>Grade: {messages.grade}</h4>
                    <p>{messages.overallMessage}</p>
                </div>
            )}
        </div>
    );
}

export default Gauge;