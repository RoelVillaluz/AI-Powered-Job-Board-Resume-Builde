import { useEffect, useState } from "react"
import { useData } from "../DataProvider.jsx"
import axios from "axios";
import { useAuth } from "../components/AuthProvider.jsx";
import Layout from "../components/Layout.jsx";

function CreateJobPosting() {
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
                <h1>Create Job Posting</h1>
                <form action="" onSubmit={handleFormSubmit}>
                    <div className="form-group">
                        <label htmlFor="">Job Title</label>
                        <input name="title" value={formData.title} type="text" onChange={handleChange}/>
                    </div>
                    <div className="form-group">
                        <label htmlFor="">Location</label>
                        <input name="location" value={formData.location} type="text" onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="">Job Type</label>
                        <input name="jobType" value={formData.jobType} type="text" onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="">Experience Level</label>
                        <input name="experienceLevel" value={formData.experienceLevel} type="text" onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="">Salary</label>
                        <input name="salary" value={formData.salary} type="number" onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label>Requirements</label>
                        <input
                            name="requirements"
                            value={requirementInput}
                            type="text"
                            onChange={(e) => setRequirementInput(e.target.value)} 
                            onKeyDown={handleAddItem} 
                        />
                    </div>
                    <div className="form-group">
                        <label>Skills</label>
                        <input
                            name="skills"
                            value={skillInput}
                            type="text"
                            onChange={(e) => setSkillInput(e.target.value)} 
                            onKeyDown={handleAddItem} 
                        />
                    </div>
                    <button>Submit</button>
                </form>

                <h3>Requirements</h3>
                <ul>
                    {formData.requirements.map((skill, index) => (
                        <li key={index}>{skill}</li>
                    ))}
                </ul>

                <h3>Skills</h3>
                <ul>
                    {formData.skills.map((skill, index) => (
                        <li key={index}>{skill.name}</li>
                    ))}
                </ul>
            </Layout>
        </>
    )
}

export default CreateJobPosting