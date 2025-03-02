import { Link } from "react-router-dom";

function UpcomingInterviewsSection() {
    const currentDate = new Date();
    const date = currentDate.getDate();
    const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate);
    const futureDate = new Date();

    const getFutureDates = () => {
        const dates = []

        for (let i = 0; i <= 6; i++) {
            futureDate.setDate(date + i);
            const dayNumber = futureDate.getDate();
            const dayName = futureDate.toLocaleDateString("en-US", {weekday: "short"})
            dates.push({ number: dayNumber, day: dayName })
        }
        return dates
    }

    return(
        <>
            <section className="grid-item" id="upcoming-interviews">
                <Link to={'upcoming-interviews'}>
                    <header>
                        <h3>Upcoming Interviews</h3>
                        <span className="current-month">{month}</span>
                    </header>
                    <div className="interview-details">
                        <div className="interviewer">
                            <img src="public/media/pexels-kooldark-17050921.jpg" alt="" />
                            <span>Joe Murray | 4:00 PM</span>
                        </div>
                    </div>
                    <div>
                        <ul className="date-list">
                            {getFutureDates().map((date, index) => (
                                <li key={index} className={`date ${index === 0 ? 'current': ''}`}>
                                    <Link>
                                        <span id="date-number">{date.number}</span>
                                        <span id="date-day">{date.day}</span>
                                    </Link>
                                    <div className="timeline-marker"></div>
                                </li>
                            ))}
                        </ul>
                        <div className="timeline-line"></div>
                    </div>
                </Link>
            </section>
        </>
    )
}

export default UpcomingInterviewsSection