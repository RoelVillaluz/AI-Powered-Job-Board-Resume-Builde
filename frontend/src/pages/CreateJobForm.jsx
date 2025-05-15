import { useEffect, useState } from "react"
import { useData } from "../DataProvider.jsx"
import axios from "axios";
import { useAuth } from "../components/AuthProvider.jsx";
import Layout from "../components/Layout.jsx";
import JobDetailsSection from "../components/MultiStepForm/CreateJobForm/JobDetailsSection.jsx";

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
        skills: []
    })
    const [skillInput, setSkillInput] = useState('');
    const [requirementInput, setRequirementInput] = useState('');
    
    useEffect(() => {
        document.title = 'Create Job Posting'
    }, [])

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        console.log('Form Data', formData)

        try {
            const response = await axios.post(`${baseUrl}/job-postings`, formData)
            console.log('New job posting created', response.data.data)

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
            setSkillInput('');
            setRequirementInput('');
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

        console.log('Form Data', formData)
    }

    const handleAddItem = (e) => {
        if (e.key === 'Enter' && e.target.value.trim() !== "") {
            e.preventDefault();

            const fieldName = e.target.name;
            const newValue = e.target.value.trim();

            setFormData((prev) => {
                if (fieldName === "skills") {
                    return { ...prev, skills: [...prev.skills, { name: newValue }] };
                } else if (fieldName === "requirements") {
                    return { ...prev, requirements: [...prev.requirements, newValue] };
                }
                return prev;
            });

            if (fieldName === "skills") {
                setSkillInput("");
            } else if (fieldName === "requirements") {
                setRequirementInput("");
            }
        }
    }
    

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
                                <i className="fa-solid fa-lightbulb"></i>
                                <span>Skills</span>
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
                    <form className="form-panel" style={{ flex: '3' }}>
                        <JobDetailsSection formData={formData} setFormData={setFormData} handleChange={handleChange}/>
                    </form>
                </div>
            </Layout>
        </>
    )
}

export default CreateJobForm