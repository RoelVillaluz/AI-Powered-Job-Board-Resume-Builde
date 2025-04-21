import { useEffect, useState } from "react"
import Layout from "./Layout"
import axios from "axios";
import { useData } from "../DataProvider";
import { useParams } from "react-router-dom";

function JobDetailPage() {
    const { baseUrl } = useData();
    const { jobId } = useParams();
    const [job, setJob] = useState(null);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const response = await axios.get(`${baseUrl}/job-postings/${jobId}`)
                console.log('Job Posting: ', response.data.data)
                
                setJob(response.data.data)
            } catch (error) {
                console.error('Error: ', error)
            } 
        }
        fetchJob()
    }, [jobId])

    return (
        <>
            <Layout>
                <main id="job-details-page">
                    <header>
                        <h1>{job?.title}</h1>
                    </header>
                </main> 
            </Layout>
        </>
    )
}

export default JobDetailPage