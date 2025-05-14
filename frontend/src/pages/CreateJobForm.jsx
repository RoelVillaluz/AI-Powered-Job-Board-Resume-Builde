import { useEffect, useState } from "react"
import { useData } from "../DataProvider.jsx"
import axios from "axios";
import { useAuth } from "../components/AuthProvider.jsx";
import Layout from "../components/Layout.jsx";

function CreateJobForm() {
    const { baseUrl } = useData();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        company: user.company,
        location: '',
        jobType: '',
        experienceLevel: '',
        salary: '',
        requirements: [],
        skills: []
    })
    const [skillInput, setSkillInput] = useState('');
    const [requirementInput, setRequirementInput] = useState('');

    const jobTypeOptions = ['Full-Time', 'Part-Time', 'Contract', 'Internship']
    const experienceLevelOptions = ['Intern', 'Entry', 'Mid-Level', 'Senior']
    
    useEffect(() => {
        document.title = 'Create Job Posting'
    }, [])

    console.log(user)

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
        setFormData({...formData, [e.target.name]: e.target.value})
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
                    <form className="form-panel" style={{ flex: '4' }}>
                        
                    </form>
                </div>
            </Layout>
        </>
    )
}

export default CreateJobForm