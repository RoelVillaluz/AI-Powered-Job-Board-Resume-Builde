import { useState, useEffect } from "react";

function Gauge({ progress, messages }) {
    const [animatedProgress, setAnimatedProgress] = useState(0); // Start at 0 for animation

    useEffect(() => {
        const timeout = setTimeout(() => setAnimatedProgress(progress), 300);
        return () => clearTimeout(timeout); // Cleanup function
    }, [progress]); // Runs when `progress` changes

    const rotation = `rotate(${animatedProgress / 2}turn)`;

    const showMessage = (value) => {
        const result = Object.entries(messages)
            .sort(([a], [b]) => parseFloat(a) - parseFloat(b)) // Sort numerically
            .find(([key]) => value <= parseFloat(key))?.[1] || messages[1];

        return (
            <>
                <h4>{result.rating}</h4>
                <p>{result.message}</p>
            </>
        );
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
                ></div>
                <div className="gauge-cover">
                    <h2>{Math.round(progress * 100)}<span>%</span></h2>
                    <p>Resume score</p>
                </div>
            </div>
            {showMessage(progress)}
        </div>
    )
}

export default Gauge