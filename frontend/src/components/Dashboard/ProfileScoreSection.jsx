import { useEffect, useState } from "react";

function ProfileScoreSection() {
    const finalProgress = 0.15; // Final progress value (0 to 1)
    const [progress, setProgress] = useState(0); // Start at 0 for animation

    useEffect(() => {
        setTimeout(() => setProgress(finalProgress), 300); // Smooth transition
    }, []);

    const rotation = `rotate(${progress / 2}turn)`;

    const messages = {
        0.25: {
          rating: "Poor",
          message: "Your resume needs significant improvement. Consider adding more details about your experience and skills.",
        },
        0.5: {
          rating: "Average",
          message: "Your resume is decent, but there’s room for improvement. Try refining your descriptions and adding measurable achievements.",
        },
        0.75: {
          rating: "Good",
          message: "Your resume is well-structured! A few tweaks and refinements could make it even stronger.",
        },
        0.9: {
            rating: "Great",
            message: "You're almost there! Your resume stands out, but adding more tailored keywords and formatting improvements could take it to the next level.",
        },
        1: {
          rating: "Excellent",
          message: "Nearly flawless! Your resume effectively presents your qualifications",
        },
    };

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
        <section className="grid-item" id="profile-score">
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
        </section>
    );
}

export default ProfileScoreSection;
