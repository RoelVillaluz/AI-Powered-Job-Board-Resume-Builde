import { useEffect, useState } from "react"
import Layout from "../components/Layout"
import { Link } from "react-router-dom"
import axios from "axios"
import { useData } from "../DataProvider"
import { useAuth } from "../components/AuthProvider"
import similarity from "compute-cosine-similarity"

function Dashboard () {
    const { baseUrl } = useData();
    const { user } = useAuth();
    const [resumes, setResumes] = useState([]);
    const [name, setName] = useState(null);
    const [jobRecommendations, setJobRecommendations] = useState([]);

    useEffect(() => {
        document.title = 'Dashboard'
    }, [])

    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const response = await axios.get(`${baseUrl}/resumes/user/${user._id}`)
                console.log('Resumes:', response.data)
                setResumes(response.data.data)

                // Assuming the user is populated in the first resume
                if (response.data.data.length > 0) {
                    setName(response.data.data[0].firstName);
                }
            } catch (error) {
                console.error('Error', error)
            }
        }
        fetchResumes()
    }, [])

    useEffect(() => {        
        const fetchJobRecommendations = async () => {
            try {
                const responses = await Promise.all(
                    resumes.map(resume => 
                        axios.get(`${baseUrl}/ai/job-recommendations/${resume._id}`)
                    )
                )
                const recommendations = responses.flatMap(response => response.data.data);
                console.log('Recommendations:', recommendations)
                setJobRecommendations(recommendations)
            } catch (error) {
                console.error('Error', error)
            }
        }
        fetchJobRecommendations()
    }, [resumes])

    const getMatchClass = (similarity) => {
        if (similarity <= 25) {
            return 'very-low'
        } else if (similarity <= 50 && similarity > 25) {
            return 'low'
        } else if (similarity <= 75 && similarity > 50) {
            return 'average'
        } else {
            return 'high'
        }
    }

    return (
        <>
            <Layout>
                <main className="dashboard">
                    <header id="dashboard-header">
                        <h1>Welcome Back, {name}</h1>
<p>Let's find your next opportunity.</p>
                    </header>
                    <section className="grid-container">
                        <section className="grid-item" id="my-jobs">
                            <header>
                                <h3>My Jobs</h3>
                                <Link>
                                    <i className="fa-solid fa-angle-right"></i>
                                </Link>
                            </header>
                            <ul>
                                <Link to={'/my-jobs/saved'}>
                                    <li>
                                        <div className="row">
                                            <i className="fa-solid fa-bookmark"></i>
                                            <div>
                                                <strong>Saved</strong>
                                                <p>(0) jobs</p>
                                            </div>
                                        </div>
                                        <i className="fa-solid fa-angle-right"></i>
                                    </li>
                                </Link>
                                <Link to={'/my-jobs/applied'}>
                                    <li>
                                        <div className="row">
                                            <i className="fa-solid fa-file-invoice"></i>
                                            <div>
                                                <strong>Applied</strong>
                                                <p>(0) jobs</p>
                                            </div>
                                        </div>
                                        <i className="fa-solid fa-angle-right"></i>
                                    </li>
                                </Link>
                                <Link to={'/my-jobs/interviews'}>
                                    <li>
                                        <div className="row">
                                            <i className="fa-solid fa-clipboard-question"></i>
                                            <div>
                                                <strong>Interviews</strong>
                                                <p>(0) jobs</p>
                                            </div>
                                        </div>
                                        <i className="fa-solid fa-angle-right"></i>
                                    </li>
                                </Link>
                                <Link to={'/my-jobs/offers'}>
                                    <li>
                                        <div className="row">
                                            <i className="fa-solid fa-briefcase"></i>
                                            <div>
                                                <strong>Offers</strong>
                                                <p>(0) jobs</p>
                                            </div>
                                        </div>
                                        <i className="fa-solid fa-angle-right"></i>
                                    </li>
                                </Link>
                            </ul>
                        </section>  
                        <section className="grid-item" id="job-recommendations">
                            <header>
                                <h3>Recommended Jobs ({jobRecommendations.length})</h3>
                            </header>
                            <ul className="job-list">
                                {jobRecommendations.map((job) => (
                                    <li key={job._id} className="recommended-job">
                                        <Link to={`/jobs/${job._id}`}>
                                            <div className="row">
                                                <div className="wrapper">
                                                    {job.company.logo 
                                                        ? (
                                                            <img></img>
                                                        ) : (
                                                            <i className="fa-solid fa-building" id="company-logo"></i>
                                                    )}
                                                    <div className="details">
                                                        <strong>{job.title}</strong>
                                                        <p>{job.company.name}</p>
                                                    </div>
                                                </div>
                                                <i className="fa-regular fa-bookmark" id="save-job-btn"></i>
                                            </div>
                                            <ul className="tags">
                                                {job.matchedSkills.slice(0, 3).map((skill) => (
                                                    <li className="matched">{skill}</li>
                                                ))}
                                                {job.matchedSkills.length > 3 && (
                                                    <li className="matched">+{job.matchedSkills.length - 3}</li>
                                                )}
                                            </ul>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </section>
                </main>
            </Layout>
        </>
    )
}

export default Dashboard