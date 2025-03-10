import { Link } from "react-router-dom"

const currentDate = new Date();
    const currentDay = currentDate.getDay()
    
    // Calculate the difference to get back to Monday (if today is Monday, diff = 0)
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay

    const startDate = new Date(currentDate)
    startDate.setDate(currentDate.getDate() + diffToMonday)

    const getWeekDates = () => {
        const dates = []

        for (let i = 0; i < 7; i++) {
            const futureDate = new Date(startDate)
            futureDate.setDate(startDate.getDate() + i)

            const dayName = futureDate.toLocaleDateString("en-US", { weekday: 'short' })

            dates.push(dayName)
        }
        return dates
    }

    useEffect(() => {
        const trackUserLogin = async () => {
            if (!user?._id) return; // Ensure user is valid
    
            try {
                const response = await axios.post(`${baseUrl}/users/track-login/${user._id}`, { userId: user._id });
                console.log(response.data)
                setLoginStreak(response.data.streak)
            } catch (error) {
                console.error("Error tracking login:", error);
            }
        };
    
        trackUserLogin();
    }, [user, baseUrl]);

    return (
        <>
            <section className="grid-item" id="user-streak">
                <div className="streak-count">
                    <i className="fa-solid fa-fire"></i>
                    <span>0 days</span>
                    <p>Streak</p>
                </div>
                <div className="streak-days">
                    <div className="row">
                        <h5>Log in daily to get rewards</h5>
                        <Link to={'/login-rewards'}>See rewards <i className="fa-solid fa-angle-right"></i></Link>
                    </div>
                    <ul>
                        {getFutureDates().map((date, index) => (
                        <li key={index}>
                            <div className="status"></div>
                            <span>{date.day}</span>
                        </li>
                        ))}
                    </ul>
                </div>
            </section>
        </>
    )
}

export default UserStreakSection