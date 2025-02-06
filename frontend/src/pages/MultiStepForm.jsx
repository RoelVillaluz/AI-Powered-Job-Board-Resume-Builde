import { useEffect, useState } from "react"
import Layout from "../components/Layout"

function MultiStepForm() {
    useEffect(() => {
        document.title = "Let's get started"
    })

    const steps = ['role', 'details', 'skills', 'resume', 'finished'];
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [selectedRole, setSelectedRole] = useState(null);
    const [isNextAllowed, setIsNextAllowed] = useState(false);

    useEffect(() => {
        setIsNextAllowed(selectedRole !== null)
        console.log(selectedRole)
    }, [selectedRole])

    const nextStep = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex((prev) => prev + 1)
            setIsNextAllowed(false)
        }
    }

    const prevStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex((prev) => prev - 1)
            setIsNextAllowed(true)
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
                            <i className="fa-solid fa-user-tie"></i>
                            <div>
                                <span>Choose your role.</span>
                                <p className="supporting-text">Pick job seeker or employer to customize your experience.</p>
                            </div>
                        </li>
                        {selectedRole !== null && (
                            <>
                                <li>
                                    <i className="fa-solid fa-address-book"></i>
                                    <div>
                                        <span>Add details.</span>
                                        <p className="supporting-text">
                                            {selectedRole === 'jobseeker' 
                                            ? 'Fill in your info to generate your resume.' 
                                            : "Provide the details of your company."}
                                        </p>
                                    </div>
                                </li>
                                <li>
                                    <i className="fa-solid fa-lightbulb"></i>
                                    <div>
                                        <span>Skills</span>
                                        <p className="supporting-text">
                                            {selectedRole === 'jobseeker'
                                            ? 'Add skills to boost your resume and get job matches.'
                                            : 'List the skills required for the job.'
                                            }
                                        </p>
                                    </div>
                                </li>
                                {selectedRole === 'jobseeker' && (
                                    <li>
                                        <i className="fa-solid fa-file-invoice"></i>
                                        <div>
                                            <span>Pick a resume template</span>
                                            <p className="supporting-text">Choose a template, and we'll populate it for you.</p>
                                        </div>
                                    </li>
                                )}
                                <li>
                                    <i class="fa-solid fa-check"></i>
                                    <div>
                                        <span>Welcome!</span>
                                        <p className="supporting-text">You're ready! Start your journey.</p>
                                    </div>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
                <div className="form-panel">
                    {currentStepIndex === 0 && (
                        <section className="select-role">
                            <header>
                                <h3>Let's start with your role!</h3>    
                                <p>Tell us what position you're looking for.</p>
                            </header>
                            <div className="role-choices">
                                <div className={`role-choice ${selectedRole === 'jobseeker' ? 'selected': ''}`}
                                    onClick={() => setSelectedRole("jobseeker")}>
                                        <i class="fa-solid fa-magnifying-glass"></i>
                                        <label htmlFor="role-radio-btn">Jobseeker</label>
                                        <input type="radio" name="role" id="role-radio-btn"/>
                                        <div className="checked-indicator">
                                            <i class="fa-solid fa-check"></i>
                                        </div>
                                </div>
                                <div className={`role-choice ${selectedRole === 'employer' ? 'selected' : ''}`}
                                    onClick={() => setSelectedRole("employer")}>
                                        <i class="fa-solid fa-building"></i>
                                        <label htmlFor="role-radio-btn">Employer</label>
                                        <input type="radio" name="role" id="role-radio-btn"/>
                                        <div className="checked-indicator">
                                            <i class="fa-solid fa-check"></i>
                                        </div>
                                </div>
                            </div>
                        </section>
                    )}
                    <div className="buttons" style={{ justifyContent: currentStepIndex > 0 ? "space-between" : "flex-end" }}>
                        {currentStepIndex > 0 && (
                            <button onClick={prevStep} id="prev-step-btn">Previous</button>
                        )}
                        {isNextAllowed && (<button onClick={nextStep} id="next-step-btn">Next</button>)}
                    </div>
                    {currentStepIndex === 1 && (
                        <section className="user-details">
                            <header>
                                <h3>{selectedRole === 'jobseeker'
                                    ? 'A little about you!'
                                    : 'Tell us about your company!'
                                    }</h3>
                                <p>
                                    {selectedRole === 'jobseeker'
                                    ? 'Fill in some basic details to help employers get to know you better.'
                                    : 'Provide key details about your organization to attract the right talent.'
                                    }
                                </p>
                            </header>
                            
                        </section>
                    )}
                </div>
            </div>
        </>
    )
}

export default MultiStepForm