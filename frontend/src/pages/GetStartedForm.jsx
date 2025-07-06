import { useEffect, useState } from "react"
import { useData } from "../contexts/DataProvider.jsx"
import { useNavigate } from "react-router-dom"
import Layout from "../components/Layout.jsx"
import axios from "axios"
import RoleSection from '../components/MultiStepForm/GetStartedForm/RoleSection.jsx'
import UserDetailsSection from "../components/MultiStepForm/GetStartedForm/UserDetailsSection.jsx"
import SkillsSection from "../components/MultiStepForm/GetStartedForm/SkillsSection.jsx"
import WorkExperience from "../components/MultiStepForm/GetStartedForm/WorkExperience.jsx"
import WelcomeSection from "../components/MultiStepForm/GetStartedForm/WelcomeSection.jsx"
import { useAuth } from "../contexts/AuthProvider.jsx"
import IndustrySection from "../components/Dashboard/IndustrySection.jsx"

function GetStartedForm({ role }) {
    const { baseUrl, setSuccess, setError, setErrorMessage, setSuccessMessage } = useData();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState(null);
    const steps = [
        'role',
        'details',
        ...(selectedRole === 'jobseeker'
            ? ['skills', 'workExperience', 'resume']
            : ['industry']),
        'finished' 
    ];

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isNextAllowed, setIsNextAllowed] = useState(false);
    const initialFormData = {
        user: user ? { id: user.id || user._id } : null,
        ...(role === "jobseeker"
            ? {
                  firstName: '',
                  lastName: '',
                  phone: '',
                  address: '',
                  summary: '',
                  skills: [],  
                  workExperience: [],
                  socialMedia: { facebook: '', linkedIn: '', github: '', website: '' },
                  certifications: [{ name: '', year: '' }],
              }
            : {
                  name: '',
                  industry: [],
                  location: '',
                  website: '',
                  size: '',
                  description: '',
                  logo: '',
              }),
    };
    
    const [formData, setFormData] = useState(initialFormData || { skills: [], workExperience: [] });
    
    useEffect(() => {
        if (user) {
            setFormData(prev => ({ ...prev, user: { id: user.id || user._id } }));
        }
    }, [user]);    
    
    useEffect(() => {
        console.log(currentStepIndex, steps[currentStepIndex]);
    }, [currentStepIndex])

    useEffect(() => {
        document.title = "Let's get started"
    }, [])

    useEffect(() => {
        // First, ensure formData has required properties
        if (!formData) return;
    
        switch (currentStepIndex) {
            case 0:
                setIsNextAllowed(selectedRole !== null);
                break;
            case 1:
                    const requiredFields = selectedRole === 'jobseeker' ? (
                        ["firstName", "lastName", "phone", "address", "summary"]
                    ) : (
                        ["name", "location", "description"]
                    );
                    const areDetailsFilled = requiredFields.every(field => 
                        formData[field]?.trim() !== "" && formData[field] !== undefined
                    );
                    setIsNextAllowed(areDetailsFilled);
                    break;
            case 2:
                if (selectedRole === 'jobseeker') {
                    setIsNextAllowed(formData.skills?.length >= 3);
                } else {
                    setIsNextAllowed(formData.industry.length > 0);
                }
                break;
            case 3:
                if (selectedRole === 'jobseeker') {
                    // Work Experience section (optional)
                    setIsNextAllowed(true);
                }
                break;
            case 4:
                if (selectedRole === 'jobseeker') {
                    // Resume section (optional)
                    setIsNextAllowed(true);
                }
                break;
            default:
                setIsNextAllowed(false);
        }
    }, [currentStepIndex, selectedRole, formData]);
    

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
        if (currentStepIndex > 0 ) {
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

        console.log("Form Data:", formData)

        if (!selectedRole) {
            setError(true);
            setErrorMessage("Please select a role before submitting.");
            return;
        }

        try {
            const endpoint = selectedRole === 'jobseeker' ? 'resumes' : 'companies'
            const responseUser = user.id || user._id
            const response = await axios.post(`${baseUrl}/${endpoint}`, { ...formData, user: responseUser });

            if (selectedRole === 'employer') {
                console.log('Updating user with:', { company: response.data.data._id });
                await axios.patch(`${baseUrl}/users/${responseUser}`, { company: response.data.data._id });
            }

            console.log('Response data:', response.data)
            setError(false);
            setErrorMessage(null)
            setSuccess(true)

            navigate('/')
        } catch (error) {
            console.error('Error', error);
            setSuccess(false);
            setError(true);
            setErrorMessage(error.response?.data?.formattedMessage);
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        const keys = name.split(".");

        if (keys[0] === "socialMedia") {
            setFormData(prev => ({
                ...prev,
                socialMedia: { ...prev.socialMedia, [keys[1]]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
        }
    }
    
    const handleRemoveListItem = (name, index) => {
        setFormData(prev => {
            const updatedList = [...prev[name]]
            updatedList.splice(index, 1)
            return { ...prev, [name]: updatedList }
        })
    }

    const handleDragEnd = (name, result, setFormData) => {
        if (!result.destination) return;

        setFormData(prev => {
            const reorderedList = [...prev[name]]
            const [movedItem] = reorderedList.splice(result.source.index, 1);
            reorderedList.splice(result.destination.index, 0, movedItem);

            return { ...prev, [name]: reorderedList }
        })
    };

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