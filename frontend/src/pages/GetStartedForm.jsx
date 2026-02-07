import { useEffect, useState } from "react"
import { useAuthStore } from "../stores/authStore.js"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import RoleSection from '../components/MultiStepForm/GetStartedForm/RoleSection.jsx'
import UserDetailsSection from "../components/MultiStepForm/GetStartedForm/UserDetailsSection.jsx"
import SkillsSection from "../components/MultiStepForm/GetStartedForm/SkillsSection.jsx"
import WorkExperience from "../components/MultiStepForm/GetStartedForm/WorkExperience.jsx"
import WelcomeSection from "../components/MultiStepForm/GetStartedForm/WelcomeSection.jsx"
import IndustrySection from "../components/Dashboard/IndustrySection.jsx"
import { BASE_API_URL } from "../config/api.js"
import StepsContainer from "../components/MultiStepForm/GetStartedForm/StepsContainer.jsx"

function GetStartedForm() {
    const user = useAuthStore(state => state.user)
    const setUser = useAuthStore(state => state.setUser)
    const navigate = useNavigate()

    const [selectedRole, setSelectedRole] = useState(null)
    // const [formData, setFormData] = useState({ user: null });

    // console.log('User: ', user)

    // useEffect(() => {
    //     if (user) {
    //         setFormData(prev => ({ ...prev, user: { id: user.id || user._id } }));
    //     }
    // }, [user]);    
    
    useEffect(() => {
        document.title = "Let's get started"
    }, [])

    return (
        <>
            <div className="form-container" id="multi-step-form">
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
                        {/* step markers  */}
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
                                {selectedRole === 'jobseeker' ? (
                                    <>
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
                                        <li>
                                            <i className="fa-solid fa-briefcase"></i>   
                                            <div>
                                                <span>Add work experience</span>
                                                <p className="supporting-text">Mention your previous roles, responsibilities, and achievements to strengthen your resume.</p>
                                            </div>
                                        </li>
                                        <li>
                                            <i className="fa-solid fa-file-invoice"></i>
                                            <div>
                                                <span>Pick a resume template</span>
                                                <p className="supporting-text">Choose a template, and we'll populate it for you.</p>
                                            </div>
                                        </li>
                                    </>
                                ) : (
                                    <li>
                                        <i className="fa-solid fa-industry"></i>
                                        <div>
                                            <span>Select Industry</span>
                                            <p>Choose the industry that best fits your company.</p>
                                        </div>
                                    </li>
                                )}
                                <li>
                                    <i className="fa-solid fa-check"></i>
                                    <div>
                                        <span>Welcome!</span>
                                        <p className="supporting-text">You're ready! Start your journey.</p>
                                    </div>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
                <form className="form-panel" onSubmit={handleFormSubmit} onKeyDown={handleKeyDown}>

                    {/* ROLE SELECTION SECTION */}
                    {currentStepIndex === 0 && (
                        <RoleSection selectedRole={selectedRole} setSelectedRole={setSelectedRole}/>
                    )}

                    {/* USER DETAILS SECTION */}
                    {currentStepIndex === 1 && (
                        <UserDetailsSection selectedRole={selectedRole} formData={formData} handleChange={handleChange}/>
                    )}

                    {selectedRole === "jobseeker" ? (
                        <>
                            {/* SKILLS SECTION */}
                            {currentStepIndex === 2 && (
                                <SkillsSection 
                                    selectedRole={selectedRole} 
                                    formData={formData} 
                                    setFormData={setFormData} 
                                    handleChange={handleChange} 
                                    handleDrag={handleDragEnd}
                                    handleRemove={handleRemoveListItem}
                                />
                            )}

                            {/* WORK EXPERIENCE SECTION */}
                            {currentStepIndex == 3 && (
                                <WorkExperience 
                                    formData={formData} 
                                    setFormData={setFormData} 
                                    handleDrag={handleDragEnd}
                                    handleRemove={handleRemoveListItem}
                                />
                            )}
                        </>
                    ) : (
                        // INDUSTRY SELECTION SECTION
                        currentStepIndex === 2 && (
                            <IndustrySection formData={formData} handleChange={handleChange}/>
                        )
                    )}

                    {/* FINISHED */}
                    {steps[currentStepIndex] === 'finished' && (
                        <WelcomeSection selectedRole={selectedRole} />
                    )}


                    <div className="buttons" style={{ justifyContent: currentStepIndex > 0 ? "space-between" : "flex-end" }}>
                        {currentStepIndex > 0 && (
                            <button onClick={prevStep} id="prev-step-btn" type="button">Previous</button>
                        )}
                        {steps[currentStepIndex] === 'finished' ? (
                            <button id="submit-btn" type="submit">
                                Submit
                            </button>
                        ) : (
                            isNextAllowed && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();  // <-- Prevents form submission
                                        nextStep();
                                    }}
                                    id="next-step-btn"
                                    type="button"
                                >
                                    Next
                                </button>
                            )
                        )}

                    </div>
                </form>
            </div>
        </>
    )
}

export default GetStartedForm
