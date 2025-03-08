import { Link } from "react-router-dom";

function ApplicationProgressSection() {
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
            <section className="grid-item" id="application-progress">
                <main>
                    <div className="row">
                        <div className="job">
                            <img src="public/company_logos/technova.png" alt="" />
                            <div>
                                <h4>Full-Stack Developer</h4>
                                <p>Technova Solutions</p>
                            </div>
                        </div>
                        <div className="status">
                            <div className="circle"></div>
                            <span>Ongoing</span>
                        </div>
                    </div>
                    <div className="stage">
                        <span>Stage 1/4</span>
                        <h1>Applied</h1>
                    </div>
                    <div className="time">
                        <p>Submitted March 8, 2025 • 11:07 AM</p>
                    </div>
                    <div className="status-toggle-buttons">
                        <button type="button">Ongoing</button>
                        <button type="button">Completed</button>
                    </div>
                </main>
            </section>
        </>
    )
}

export default ApplicationProgressSection