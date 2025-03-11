import { Link } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";

function UserStreakSection({ user, baseUrl, loading }) {
    const [loginStreak, setLoginStreak] = useState(null);
    const [loggedInDates, setLoggedInDates] = useState([]);

    const currentDate = new Date();
    const currentDay = currentDate.getDay();

    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() + diffToMonday);

    const getWeekDates = () => {
        return [...Array(7)].map((_, i) => {
            const futureDate = new Date(startDate);
            futureDate.setDate(startDate.getDate() + i);
            return {
                dayName: futureDate.toLocaleDateString("en-US", { weekday: "short" }),
                date: futureDate.toISOString().split("T")[0], // YYYY-MM-DD
            };
        });
    };

    console.log('Logged in dates:', loggedInDates)

    useEffect(() => {
        const trackUserLogin = async () => {
            if (!user?._id) return;
    
            try {
                const response = await axios.post(`${baseUrl}/users/track-login/${user._id}`, { userId: user._id });
                setLoginStreak(response.data.streak);
                setLoggedInDates(response.data.loggedInDates || []);
            } catch (error) {
                console.error("Error tracking login:", error);
            }
        };
    
        trackUserLogin();
    }, [user, baseUrl]);

    return (
        <section className={`grid-item ${!loading ? '' : 'skeleton'}`} id="user-streak">
            {!loading && (
                <>
                    <div className="streak-count">
                        <i className="fa-solid fa-fire"></i>
                        <span>{loginStreak} {loginStreak > 1 ? "days" : "day"}</span>
                        <p>Streak</p>
                    </div>
                    <div className="streak-days">
                        <div className="row">
                            <h5>Log in daily to get rewards</h5>
                            <Link to="/login-rewards">See rewards <i className="fa-solid fa-angle-right"></i></Link>
                        </div>
                        <ul>
                            {getWeekDates().map(({ dayName, date }, index) => (
                                <li key={index}>
                                    {loggedInDates.includes(date) ? (
                                        <div className="status logged-in">
                                            <i className="fa-solid fa-check"></i>
                                        </div>
                                    ) : (
                                        <div className="status"></div>
                                    )}
                                    <span>{dayName}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            )}
        </section>
    );
}

export default UserStreakSection;
