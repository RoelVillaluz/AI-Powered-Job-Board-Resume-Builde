import { useEffect, useState } from "react";
import Gauge from "../Gauge";

function ProfileScoreSection() {
    const [progress, setProgress] = useState(0.9); 

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
            message: "You're almost there, but filling out minor missing details could take it to the next level.",
        },
        1: {
          rating: "Excellent",
          message: "Nearly flawless! Your resume effectively presents your qualifications",
        },
    };

    return (
        <section className="grid-item" id="profile-score">
            <header>
                <h4>Resume Score</h4>
            </header>
            <Gauge progress={progress} messages={messages}/>
        </section>
    );
}

export default ProfileScoreSection;
