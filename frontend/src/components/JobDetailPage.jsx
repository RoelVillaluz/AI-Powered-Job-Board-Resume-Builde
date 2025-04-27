import { useEffect, useState } from "react"
import Layout from "./Layout"
import axios from "axios";
import { useData } from "../DataProvider";
import { useParams } from "react-router-dom";
import { faL } from "@fortawesome/free-solid-svg-icons";
import Resume from "../../../backend/models/resumeModel";

function JobDetailPage() {
    const { baseUrl } = useData();
    const { jobId } = useParams();
    const [job, setJob] = useState(null);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true)

    const [userPreferences, setUserPreferences] = useState({

    })

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const response = await axios.get(`${baseUrl}/job-postings/${jobId}`)
                console.log('Job Posting: ', response.data.data)
                
                setJob(response.data.data)
            } catch (error) {
                console.error('Error: ', error)
            } finally {
                setLoading(false)
            }
        }
        fetchJob()
    }, [jobId])

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const response = await axios.get(`${baseUrl}/companies/${job?.company?._id}`)
                console.log('Company: ', response.data.data)

                setCompany(response.data.data)
            } catch (error) {
                console.error('Error: ', error)
            }
        }
        fetchCompany()
    }, [job?.company])

    const handleAddSkill = async (resumeId, newSkill) => {
        const currentResume = user.resumes.find(resume => resume._id === resumeId)
        if (!currentResume || currentResume.skills.includes(newSkill)) return;

        const updatedSkills = [...currentResume.skills, newSkill]

        try {
            const response = await axios.patch(`${baseUrl}/resumes/${resumeId}`, {
                ...currentResume,
                skills: [updatedSkills]
            })
        } catch (error) {
            console.error('Failed to add skill:', error);
        }
    }

    useEffect(() => {
        document.title = `${job?.title} - ${company?.name}`
    }, [job?._id])

    return (
        <>
            <Layout>
                <main id="job-details-page">

                    <section id="job-details">
                        <header>
                            {company?.banner ? (
                                <img src={`/${company?.banner}`} className="company-banner-image" alt={`${company?.name} banner`}></img>
                            ) : (
                                <div className="banner">
                                </div>
                            )}
                            <div className="icons">
                                <img src={`/${company?.logo}`} alt={`${company?.name} logo`} className="company-logo" />
                                <div className="socials">
                                    <div className="social-media-icon">
                                        <i className="fa-brands fa-facebook"></i>
                                    </div>
                                    <div className="social-media-icon">
                                        <i className="fa-brands fa-linkedin-in"></i>
                                    </div>
                                    <div className="social-media-icon">
                                        <i className="fa-solid fa-share-nodes"></i>
                                    </div>
                                </div>
                            </div>
                            <div className="job-overview">
                                <div className="row">
                                    <h1>{job?.title}</h1>
                                    <span className="posted-at">Posted 2 days ago</span>
                                    <h2>${Number(job?.salary).toLocaleString()}<span>/year</span></h2>
                                </div>
                                <div className="row">
                                    <div>
                                        <h3>{company?.name}</h3>
                                        <h4>{company?.location}</h4>
                                    </div>
                                    <div className="actions">
                                        <button className="apply-btn">Apply Now</button>
                                        <button className="save-btn">
                                            <i className="fa-regular fa-bookmark"></i>
                                        </button>
                                        <button className="settings-btn">
                                            <i className="fa-solid fa-gear"></i>
                                        </button>
                                    </div>
                                </div>
                                <div className="applicants">
                                    <img src="/media/pexels-alipli-15003448.jpg" alt="Applicant Image" />
                                    <img src="/media/pexels-anthonyshkraba-production-8278885.jpg" alt="Applicant Image" />
                                    <img src="/media/pexels-tima-miroshnichenko-6694958.jpg" alt="Applicant Image" />
                                    <span>3 Applicants</span>
                                </div>
                            </div>
                        </header>
                        <section className="job-highlights">
                            <ul className="">
                                <li>
                                    <i className="fa-solid fa-user-tie" aria-hidden="true"></i>
                                    <div>
                                        <h5>Experience Level</h5>
                                        <h3>{job?.experienceLevel}</h3>
                                    </div>
                                </li>
                                <li>
                                    <i className="fa-solid fa-briefcase" aria-hidden="true"></i>
                                    <div>
                                        <h5>Job Type</h5>
                                        <h3>{job?.jobType}</h3>
                                    </div>
                                </li>
                                <li>
                                    <i className="fa-solid fa-house-laptop" aria-hidden="true"></i>
                                    <div>
                                        <h5>Work Setup</h5>
                                        <h3>Remote</h3>
                                    </div>
                                </li>
                                <li>
                                    <i className="fa-solid fa-industry" aria-hidden="true"></i>
                                    <div>
                                        <h5>Industry</h5>
                                        <h3>{company?.industry[0]}</h3>
                                    </div>
                                </li>
                            </ul>
                        </section>
                    </section>

                    <section id="job-company-details">

                    </section>

                </main> 
            </Layout>
        </>
    )
}

export default JobDetailPage