import { useState, useEffect } from "react";
import axios from "axios";

export const useJobDetails = (baseUrl, jobId) => {
    const [job, setJob] = useState(null);
    const [company, setCompany] = useState(null);
    const hasQuestions = job?.preScreeningQuestions?.length > 0

    const [loading, setLoading] = useState(true);
    const [isComparing, setIsComparing] = useState(false);

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
            }
        }
        fetchJob()
    }, [jobId])

    useEffect(() => {
        const fetchCompany = async () => {
            if (!job?.company?._id) return; 

            try {
                const response = await axios.get(`${baseUrl}/companies/${job?.company?._id}`)
                console.log('Company: ', response.data.data)

                setCompany(response.data.data)
            } catch (error) {
                console.error('Error: ', error)
            }
        }
        fetchCompany()
    }, [job?.company?._id])

    useEffect(() => {
        if (job && company) {
            setLoading(false)
        }
    }, [job, company])

    
    return { job, company, loading }
}