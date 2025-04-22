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

                    </section>

                    <section id="similar-jobs">

                    </section>

                </main> 
            </Layout>
        </>
    )
}

export default JobDetailPage