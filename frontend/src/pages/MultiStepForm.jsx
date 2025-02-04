import { useEffect } from "react"
import Layout from "../components/Layout"

function MultiStepForm() {
    useEffect(() => {
        document.title = "Let's get started"
    })

    return (
        <>
            <div className="form-container" id="get-started-form">
                <div className="steps">
                    <header>
                        <h2>Let's get started</h2>
                        <p className="subheader">
                            You've successfully verified your email. 
                            Let's set up your profile to get the best experience.
                        </p>
                    </header>
                    <ul>
                        <li className="active">
                            <i class="fa-solid fa-user"></i>
                            <div>
                                <span>Choose your role.</span>
                                <p className="supporting-text">Pick job seeker or employer to customize your experience.</p>
                            </div>
                        </li>
                        <li>
                            <i class="fa-solid fa-info"></i>
                            <div>
                                <span>Add details.</span>
                                <p className="supporting-text">Fill in your info to generate your resume.</p>
                            </div>
                        </li>
                        <li>
                            <i class="fa-solid fa-lightbulb"></i>
                            <div>
                                <span>Skills</span>
                                <p className="supporting-text">Add skills to boost your resume and get job matches.</p>
                            </div>
                        </li>
                        <li>
                            <i class="fa-solid fa-file-invoice"></i>
                            <div>
                                <span>Pick a resume template</span>
                                <p className="supporting-text">Choose a template, and we'll populate it for you.</p>
                            </div>
                        </li>
                        <li>
                            <i class="fa-solid fa-door-open"></i>
                            <div>
                                <span>Welcome!</span>
                                <p className="supporting-text">You're ready! Start your journey.</p>
                            </div>
                        </li>
                    </ul>
                </div>
                <div className="right">
                    
                </div>
            </div>
        </>
    )
}

export default MultiStepForm