import { useEffect, useState } from "react"
import Layout from "./Layout"
import axios from "axios";
import { useData } from "../DataProvider";
import { useParams } from "react-router-dom";
import { faL } from "@fortawesome/free-solid-svg-icons";

function JobDetailPage() {
    const { baseUrl } = useData();
    const { jobId } = useParams();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true)

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
        document.title = `${job?.title} - ${job?.company.name}`
    }, [job?._id])

    return (
        <>
            <Layout>
                <main id="job-details-page">

                    <section id="job-details">

                        <header>
                            <div className="job-overview">
                                <img id="company-logo" src={`/${job?.company?.logo}`} alt="" />
                                <h1>{job?.title}</h1>
                                <h3>{job?.company?.name} • {job?.location}</h3>
                            </div>
                        </header>

                        <div className="details">
                            <ul id="icons"> 
                                <li>
                                    <i className="fa-regular fa-clock" aria-hidden="true"></i>
                                    <div>
                                        <span>Job Type</span>
                                        <h4>{job?.jobType}</h4>
                                    </div>
                                </li>
                                <li>
                                    <i className="fa-solid fa-user-tie" aria-hidden="true"></i>
                                    <div>
                                        <span>Experience Level</span>
                                        <h4>{job?.experienceLevel}</h4>
                                    </div>
                                </li>
                                <li>
                                    <i className="fa-regular fa-money-bill-1" aria-hidden="true"></i>
                                    <div>
                                        <span>Salary</span>
                                        <h4>${Number(job?.salary).toLocaleString()} / year</h4> 
                                    </div>
                                </li>
                                <li>
                                    <i className="fa-solid fa-users" aria-hidden="true"></i>
                                    <div>
                                        <span>Number of applicants</span>
                                        <h4>0</h4> 
                                    </div>
                                </li>
                            </ul>
                        
                            <div className="job-details-section">
                                <h3>Job Description</h3>
                                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. 
                                    Optio, a nulla placeat ex aperiam error, iure quam pariatur dicta ducimus eius asperiores cumque unde minus quaerat totam, 
                                    reiciendis esse dolor?
                                </p>
                            </div>

                            <div className="job-details-section">
                                <h3>Requirements</h3>
                                <ul>
                                    {job?.requirements.map((requirement, index) => (
                                        <li key={index}>{requirement}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="job-details-section" id="skills-section">
                                <h3>Skills</h3>
                                <div>progress bar skills matched for checklist</div>
                                <ul>
                                    {job?.skills.map((skill, index) => (
                                        <li key={index}>
                                            <div class="checkbox-wrapper-19">
                                                <input type="checkbox" id={`cbtest-19 ${skill.name}`} />
                                                <label for={`cbtest-19 ${skill.name}`} class="check-box" />
                                            </div>
                                            <label htmlFor={`${skill.name}-checkbox`}>{skill.name} {skill.level}</label>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                        </div>

                    </section>

                    <section id="similar-jobs">

                    </section>

                </main> 
            </Layout>
        </>
    )
}

export default JobDetailPage