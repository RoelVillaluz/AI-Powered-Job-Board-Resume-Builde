import { useEffect } from "react";
import { useData } from "./DataProvider.jsx"
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

function LandingPage () {
    const { users = [], jobPostings = [], resumes = [], getAllData } = useData();

    useEffect(() => {
        document.title = 'Landing Page'

        getAllData(["users", "job-postings", "resumes"])
    }, [])

    return (
        <>
            <main className="hero-section">
               <figure>
                    <img src="/public/media/pexels-fauxels-3182812.jpg" alt="" />
               </figure>
               <header>
                    <div className="left">
                        <h1>Your Next Job is 3 Steps Away!</h1>
                        <Link className="call-to-action-link" to={'/register'}>
                            Get Started Today!
                            <FontAwesomeIcon icon={faArrowRight} className="cta-icon" />
                        </Link>
                    </div>
                    <div className="right">
                        <ul className="step-list">
                            <div className="row">
                                <li>
                                    <span>1</span>
                                    <i className="fas fa-user-plus"></i>
                                    <p>Sign up</p>
                                </li>  
                                <li>
                                    <span>2</span>
                                    <i className="fas fa-file-alt"></i>
                                    <p>Choose resume template</p>
                                </li>  
                                <li>
                                    <span>3</span>
                                    <i className="fas fa-briefcase"></i>
                                    <p>Start job hunting!</p>
                                </li>   
                            </div>
                        </ul>
                    </div>
               </header>
            </main>
        </>
    )
}

export default LandingPage