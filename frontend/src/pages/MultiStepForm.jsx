import { useEffect, useState } from "react"
import Layout from "../components/Layout"
import RoleSection from '../components/MultiStepForm/RoleSection'
import UserDetailsSection from "../components/UserDetailsSection"

function MultiStepForm() {
    useEffect(() => {
        document.title = "Let's get started"
    })

    const steps = ['role', 'details', 'skills', 'resume', 'finished'];
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [selectedRole, setSelectedRole] = useState(null);
    const [isNextAllowed, setIsNextAllowed] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        summary: '',
        skills: [],
        workExperience: [{
            jobTitle: '',
            company: '',
            startDate: '',
            endDate: '',
            responsibilities: ''
        }],
        certifications: [{
            name: '',
            year: ''
        }],
        socialMedia: [{
            facebook: null,
            linkedin: null,
            github: null,
            website: null
        }]
    })

    useEffect(() => {
        document.title = "Let's get started"
    }, [])

    useEffect(() => {
        setIsNextAllowed(selectedRole !== null)
        console.log(selectedRole)
    }, [selectedRole])
    useEffect(() => {
        addActiveClass()
    }, [currentStepIndex])

    const nextStep = async () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex((prev) => prev + 1)
            setIsNextAllowed(false)

            // update the user role after selecting it
            if (selectedRole !== null) {
                try {
                    const response = await axios.patch(`${baseUrl}/users/${user.id || user._id}`, { role: selectedRole })
                    console.log(response.data)
                    setUser(response.data)
                } catch (error) {
                    console.error()
                }
            }
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

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        if (!selectedRole) {
            setError(true);
            setErrorMessage("Please select a role before submitting.");
            return;
        }

        console.log(formData)

        try {
            const response = await axios.post(`${baseUrl}/resumes`, formData)
            setError(false);
            setErrorMessage(null)
            setSuccess(true)
        } catch (error) {
            console.error('Error', error);
            setSuccess(false);
            setError(true);
            setErrorMessage(error.response?.data?.formattedMessage);
        }
    }

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
                <form className="form-panel">
                    {currentStepIndex === 0 && (
                        <RoleSection selectedRole={selectedRole} setSelectedRole={setSelectedRole}/>
                    )}
                    {currentStepIndex === 1 && (
                        <UserDetailsSection selectedRole={selectedRole}/>
                    )}
                    <div className="buttons" style={{ justifyContent: currentStepIndex > 0 ? "space-between" : "flex-end" }}>
                        {currentStepIndex > 0 && (
                            <button onClick={prevStep} id="prev-step-btn">Previous</button>
                        )}
                        {isNextAllowed && (<button onClick={nextStep} id="next-step-btn">Next</button>)}
                    </div>
                </form>
            </div>
        </>
    )
}

export default MultiStepForm