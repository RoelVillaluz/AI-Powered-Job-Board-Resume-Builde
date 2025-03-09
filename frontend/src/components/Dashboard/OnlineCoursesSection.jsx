import axios from "axios"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom";

function OnlineCoursesSection({ user, baseUrl }) {
    const [recommendedSkills, setRecommendedSkills] = useState([])

    useEffect(() => {
        const fetchRecommendedSkills = async () => {
            try {
                const response = await axios.get(`${baseUrl}/ai/skill-recommendations/${user._id}`);
                const responseSkills = response.data;

                console.log("Recommended Skills", responseSkills);

                // Ensure we're extracting the correct array
                setRecommendedSkills(Array.isArray(responseSkills.recommended_skills) ? responseSkills.recommended_skills : []);
            } catch (error) {
                console.error("Error", error);
                setRecommendedSkills([]); // Set an empty array on error
            }
        };

        if (user?._id) {
            fetchRecommendedSkills();
        }
    }, [user._id, baseUrl]);

    return (
        <>
           <section className="grid-item" id="online-courses">
                <figure>
                    <img src="public/media/pexels-rdne-6517078.jpg" alt="Recommended Skills" />
                </figure>
                <i className="fa-solid fa-graduation-cap"></i>
                <ul>
                    {recommendedSkills.slice(0, 2).map((skill, index) => (
                        <li key={index}>{skill}</li>
                    ))}
                    {recommendedSkills.length > 2 && <li>+{recommendedSkills.length - 2}</li>}
                </ul>
                <div className="details">
                    <div>
                        <h3>Boost Your Skills</h3>
                        <p>Explore online courses tailored by AI-recommended skills.</p>
                    </div>
                    <Link to={'/courses'} aria-label="Go to courses">
                        <i className="fa-solid fa-arrow-right"></i>
                    </Link>
                </div>
            </section>
        </>
    )
}

export default OnlineCoursesSection