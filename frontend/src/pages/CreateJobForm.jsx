import { useEffect, useState } from "react"
import { useNavigate } from 'react-router-dom';
import { useData } from "../contexts/DataProvider.jsx";
import axios from "axios";
import { useAuth } from "../contexts/AuthProvider.jsx";
import Layout from "../components/Layout.jsx";
import JobDetailsSection from "../components/MultiStepForm/CreateJobForm/JobDetailsSection.jsx";
import SkillsAndRequirementsSection from "../components/MultiStepForm/CreateJobForm/SkillsAndRequirementsSection.jsx";
import PreScreeningQuestionsSection from "../components/MultiStepForm/CreateJobForm/PreScreeningQuestionsSection.jsx";
import FinishedSection from "../components/MultiStepForm/CreateJobForm/FinishedSection.jsx";

function CreateJobForm() {
    const { baseUrl } = useData();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        company: user.company,
        location: '',
        jobType: '',
        experienceLevel: '',
        salary: {
            currency: '$', // to match default in job posting schema
            amount: '',
            frequency: 'year' // to match default in job posting schema
        },
        requirements: [],
        skills: [],
        preScreeningQuestions: []
    })
    const navigate = useNavigate();

    const steps = ['details', 'skillsAndRequirements', 'questions', 'finished'];
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isNextAllowed, setIsNextAllowed] = useState(false);
    
    useEffect(() => {
        document.title = 'Create Job Posting'
    }, [])

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        console.log('Form Data', formData)

        try {
            const response = await axios.post(`${baseUrl}/job-postings`, formData)
            console.log('New job posting created', response.data.data)

            const newJobId = response.data.data._id;

            setFormData({
                title: '',
                company: user.company,
                location: '',
                jobType: '',
                experienceLevel: '',
                salary: '',
                requirements: [],
                skills: []
            });

            navigate(`/job_postings/${newJobId}`)
        } catch (error) {
            console.error('Error', error)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        const keys = name.split(".")

        if (keys[0] === "salary") {
            setFormData(prev => ({
                ...prev,
                salary: { ...prev.salary, [keys[1]]: value }
            }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const nextStep = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex((prev) => prev + 1)
            setIsNextAllowed(false)
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
    
    useEffect(() => {
        // First, ensure formData has required properties
        if (!formData) return;

        const getValue = (field) => {
            const keys = field.split(".");
            return keys.reduce((obj, key) => obj?.[key], formData)
        }

        switch (currentStepIndex) {
            case 0: 
                const requiredFields = ["title", "location", "jobType", "salary.amount"]
                const areDetailsFilled = requiredFields.every(field => {
                    const value = getValue(field);
                    return value !== undefined && value.toString().trim() !== "";
                })
                setIsNextAllowed(areDetailsFilled)
                break;
            case 1:
                setIsNextAllowed(
                    (formData.skills?.length >= 3) && (formData.requirements.length > 0)
                )
                break;
            case 2:
                setIsNextAllowed(true)
        }
    })
    
    useEffect(() => {
        console.log('Form Data: ', formData)
    }, [formData])

    useEffect(() => {
        addActiveClass()
    }, [currentStepIndex])

    return(
        <>
            <Layout>
                <div className="form-container" id="multi-step-form">
                    <div className="steps">
                        <header>
                            <h2>Let's make a job posting.</h2>
                            <p className="subheader">Ready to find the perfect candidate? Fill out the details below to create your job posting and start connecting with talent.</p>
                        </header>

                        <ul>
                            <li>
                                <i className="fa-solid fa-address-book"></i>
                                <span>Add details.</span>
                            </li>
                            <li>
                                <i className="fa-solid fa-list-check"></i>
                                <span>Skills and Requirements</span>
                            </li>
                            <li>
                                <i className="fa-solid fa-clipboard-question"></i>
                                <span>Pre-screening Questions</span>
                            </li>
                             <li>
                                <i className="fa-solid fa-check"></i>
                                <span>Finished!</span>
                            </li>
                        </ul>

                    </div>
                    <form className="form-panel" style={{ flex: '3', marginRight: '4.5rem' }}>

                        {/* Job Details Section */}
                        {currentStepIndex === 0 && (
                            <JobDetailsSection formData={formData} setFormData={setFormData} handleChange={handleChange}/>
                        )}

                        {/* Skills and Requirements Section */}
                        {currentStepIndex === 1 && (
                            <SkillsAndRequirementsSection formData={formData} setFormData={setFormData} handleChange={handleChange}/>
                        )}

                        {/* Pre-Screening Question Section */}
                        {currentStepIndex === 2 && (
                            <PreScreeningQuestionsSection formData={formData} setFormData={setFormData} handleChange={handleChange}/>
                        )}

                        {/* Finished Section */}
                        {currentStepIndex === 3 && (
                            <FinishedSection formData={formData} setCurrentStepIndex={setCurrentStepIndex}/>
                        )}

                        <div className="buttons" style={{ justifyContent: currentStepIndex > 0 ? "space-between" : "flex-end" }}>
                        {currentStepIndex > 0 && (
                            <button onClick={prevStep} id="prev-step-btn" type="button">Previous</button>
                        )}
                        {steps[currentStepIndex] === 'finished' ? (
                            <button id="submit-btn" type="submit" onClick={handleFormSubmit}>
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
            </Layout>
        </>
    )
}

export default CreateJobForm