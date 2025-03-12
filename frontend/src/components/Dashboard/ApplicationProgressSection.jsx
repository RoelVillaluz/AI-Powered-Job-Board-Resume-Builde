import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function ApplicationProgressSection({ user, baseUrl, loading }) {
    const [appliedJobs, setAppliedJobs] = useState([]);
    const [savedJobs, setSavedJobs] = useState([]);

    useEffect(() => {
        const fetchInteractedJobs = async () => {
            try {
                const response = await axios.get(`${baseUrl}/users/${user._id}/interacted-jobs`)
                console.log(response.data.data)

                setAppliedJobs(response.data.data.appliedJobs)
                setSavedJobs(response.data.data.savedJobs)
            } catch (error) {
                console.error('Error', error)
            }
        }
        fetchInteractedJobs()
    }, [baseUrl, user])
    return(
        <>
            <section className={`grid-item ${loading !== true ? '' : 'skeleton'}`} id="application-progress">
                {loading !== true && (
                    <>
                        <header>
                            <div className="job">
                                <img src="/company_logos/technova.png" alt="Technova Solutions logo" />
                                <div>
                                    <h3>Full-Stack Developer</h3>
                                    <p>Technova Solutions</p>
                                </div>
                            </div>
                            <div className="status" aria-live="polite">
                                <span>Ongoing</span>
                            </div>
                        </header>

                        <div className="details">
                            <div className="stage">
                                <span>Stage 1/4</span>
                                <h1>Applied</h1>
                            </div>
                            <div className="time">
                                <p>Submitted <time datetime="2025-03-08T11:07:00">March 8, 2025 • 11:07 AM</time></p>
                            </div>
                            <div className="status-toggle-buttons">
                                <button type="button" aria-label="Show ongoing">Ongoing</button>
                                <button type="button" aria-label="Show completed">Completed</button>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </>
    )
}

export default ApplicationProgressSection