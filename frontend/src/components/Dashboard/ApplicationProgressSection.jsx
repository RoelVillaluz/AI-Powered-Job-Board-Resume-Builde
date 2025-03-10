import { Link } from "react-router-dom";

function ApplicationProgressSection({ loading }) {
    return(
        <>
            <section className={`grid-item ${loading !== true ? '' : 'skeleton'}`} id="application-progress">
                {loading !== true && (
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
                )}
            </section>
        </>
    )
}

export default ApplicationProgressSection