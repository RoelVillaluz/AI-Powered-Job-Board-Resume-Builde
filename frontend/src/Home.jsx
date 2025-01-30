import { useEffect } from "react";
import { useData } from "./DataProvider.jsx"
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

function Home () {
    const { users = [], jobPostings = [], resumes = [], getAllData } = useData();

    useEffect(() => {
        document.title = 'Home'

        getAllData(["users", "job-postings", "resumes"])
    }, [])

    return (
        <>
            <main className="hero-section">
               <figure>
                    <img src="/public/media/pexels-fauxels-3182812.jpg" alt="" />
               </figure>
               <header>
                    <h1>Ready to Take the Next Step?</h1>
                    <div className="right">
                        <p>Whether you're a fresh graduate, a seasoned professional, 
                            or looking for a career switch, explore thousands of job openings 
                            tailored to your expertise.
                        </p>
                        <Link className="call-to-action-link">
                            Get Started
                            <FontAwesomeIcon icon={faArrowRight} className="cta-icon" />
                        </Link>
                    </div>
               </header>
            </main>
        </>
    )
}

export default Home