import { useState, useEffect } from "react";

function Gauge({ progress, messages, loading, objectName = null }) {
    const [animatedProgress, setAnimatedProgress] = useState(0); // Start at 0 for animation

    useEffect(() => {
        const timeout = setTimeout(() => setAnimatedProgress(progress), 300);
        return () => clearTimeout(timeout); // Cleanup function
    }, [progress]); // Runs when `progress` changes

    const normalized = Math.min(animatedProgress / 100, 1)
    const rotation = `rotate(${normalized / 2}turn)`

    const showMessage = (value) => {
        if (!loading && messages) {
            return (
                <>
                    <h4>Grade: {messages.grade}</h4>
                    <p>{messages.overallMessage}</p>
                </>
            );
        }
    };
    
    return (
        <div className="gauge">
            <div className="gauge-body">
                <div
                    className="gauge-fill"
                    style={{ 
                        transform: rotation, 
                        backgroundColor: 'black', 
                        transition: "transform 1.5s ease-in-out"
                    }}
                >
                </div>
                <div className={`gauge-cover`}>
                    {!loading ? (
                        <>
                            <h2>{Math.round(progress)}<span>%</span></h2>
                            <p>Effectiveness</p>
                        </>
                    ) : (
                        <>
                            <i className="fa-solid fa-brain"></i>
                            <p>Analyzing Data...</p>
                        </>
                    )}
                </div>
            </div>
            {!loading && (
                showMessage(progress)
            )}
        </div>
    )
}

export default Gauge