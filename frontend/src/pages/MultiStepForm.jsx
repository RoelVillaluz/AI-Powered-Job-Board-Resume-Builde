import { useEffect, useState } from "react"
import Layout from "../components/Layout"

function MultiStepForm() {
    useEffect(() => {
        document.title = "Let's get started"
    })

    const steps = ['role', 'details', 'skills', 'resume', 'finished']
    const [currentStepIndex, setCurrentStepIndex] = useState(0)

    const nextStep = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex((prev) => prev + 1)
        }
    }

    const prevStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex((prev) => prev - 1)
        }
    }

    const addActiveClass = () => {
        const stepMarkers = document.querySelectorAll('.steps li');
        stepMarkers.forEach((marker, index) => {
            marker.setAttribute('data-index', index)
            const markerIndex = marker.getAttribute('data-index');
            if (currentStepIndex >= markerIndex) {
                marker.classList.add('active')
            } else {
                marker.classList.remove('active')
            }
            console.log(currentStepIndex)
        })
    }

    addActiveClass()

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
                        <li>
                            <i class="fa-solid fa-user-tie"></i>
                            <div>
                                <span>Choose your role.</span>
                                <p className="supporting-text">Pick job seeker or employer to customize your experience.</p>
                            </div>
                        </li>
                        <li>
                            <i class="fa-solid fa-address-book"></i>
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
                            <i class="fa-solid fa-check"></i>
                            <div>
                                <span>Welcome!</span>
                                <p className="supporting-text">You're ready! Start your journey.</p>
                            </div>
                        </li>
                    </ul>
                </div>
                <div className="form-panel">
                    {currentStepIndex === 0 && (
                        <div id="select-role">
                            <h2>Choose your role</h2>
                            <div className="row">
                                <div className="option">
                                    <i class="fa-solid fa-magnifying-glass"></i>
                                </div>
                            </div>
                        </div>
                    )}
                    {currentStepIndex === 1 && (
                        <div id="details">
                            <h2>Tell us about yourself</h2>
                        </div>
                    )}
                    {currentStepIndex === 2 && (
                        <div id="skills">
                            <h2>What are your skills</h2>
                        </div>
                    )}
                    {currentStepIndex === 3 && (
                        <div id="resume">
                            <h2>Choose a resume template</h2>
                        </div>
                    )}
                    {currentStepIndex === 4 && (
                        <div id="finished">
                            <h2>Welcome, lets start job hunting</h2>
                        </div>
                    )}
                    {currentStepIndex > 0 && (
                        <button className="prev-step" onClick={prevStep}>Previous</button>
                    )}
                    {currentStepIndex < steps.length - 1 && (
                        <button className="next-step" onClick={nextStep}>Next</button>
                    )}
                </div>
            </div>
        </>
    )
}

export default MultiStepForm