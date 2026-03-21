import { useState, useEffect } from "react";

function Gauge({
    value,
    jobProgress = 0,
    messages = {},
    loading = false,
    isAnalyzing = false,
    secondsRemaining = null,
    objectName = null
}) {
    const [animatedValue, setAnimatedValue] = useState(0);
    const [animatedJobProgress, setAnimatedJobProgress] = useState(0);

    // Animate the final score into the gauge when it arrives
    useEffect(() => {
        if (value === null) return;
        const timeout = setTimeout(() => setAnimatedValue(value), 300);
        return () => clearTimeout(timeout);
    }, [value]);

    // Animate job progress bar while pipeline is running
    useEffect(() => {
        const timeout = setTimeout(() => setAnimatedJobProgress(jobProgress), 100);
        return () => clearTimeout(timeout);
    }, [jobProgress]);

    // While analyzing: gauge fills to job progress; when done: fills to actual score
    const displayValue = isAnalyzing ? animatedJobProgress : animatedValue;
    const normalized = Math.min(displayValue / 100, 1);
    const rotation = `rotate(${normalized / 2}turn)`;

    /**
     * Format `secondsRemaining` into a human-readable estimate string.
     *
     * Returns null if the value is null or too small to be worth showing
     * (< 4 seconds avoids the distracting flicker at the very end).
     *
     * @param {number|null} seconds
     * @returns {string|null}
     */
    const formatTimeRemaining = (seconds) => {
        if (seconds === null || seconds <= 3) return null;
        if (seconds < 60) return `~${seconds}s remaining`;
        return `~${Math.round(seconds / 60)}m remaining`;
    };

    const timeRemainingLabel = isAnalyzing ? formatTimeRemaining(secondsRemaining) : null;

    return (
        <div className={`gauge ${isAnalyzing ? "gauge--analyzing" : "gauge--complete"}`}>
            <div className="gauge-body">
                <div
                    className="gauge-fill"
                    style={{
                        transform: rotation,
                        backgroundColor: "black",
                        transition: isAnalyzing
                            ? "transform 0.8s ease-out, background-color 0.3s"
                            : "transform 1.5s ease-in-out, background-color 0.5s"
                    }}
                />

                <div className="gauge-cover">
                    {isAnalyzing ? (
                        // ── Analyzing state ──────────────────────────────────────────────
                        <>
                            <i className="fa-solid fa-brain gauge-brain-icon" />
                            <p className="gauge-progress-text">
                                {Math.round(animatedJobProgress)}%
                            </p>
                            <p className="gauge-status-text">
                                {messages?.overallMessage ?? "Analyzing..."}
                            </p>
                            {timeRemainingLabel && (
                                <p className="gauge-time-remaining">
                                    {timeRemainingLabel}
                                </p>
                            )}
                        </>
                    ) : loading ? (
                        // ── Initial loading state ────────────────────────────────────────
                        <>
                            <i className="fa-solid fa-circle-notch fa-spin" />
                            <p>Loading...</p>
                        </>
                    ) : value !== null ? (
                        // ── Final score state ────────────────────────────────────────────
                        <>
                            <h2>
                                {Math.round(animatedValue)}
                                <span>%</span>
                            </h2>
                            <p>Effectiveness</p>
                        </>
                    ) : (
                        // ── No score yet ─────────────────────────────────────────────────
                        <>
                            <i className="fa-solid fa-chart-simple" />
                            <p>No score yet</p>
                        </>
                    )}
                </div>
            </div>

            {/* Grade and overall message — only shown when fully complete */}
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