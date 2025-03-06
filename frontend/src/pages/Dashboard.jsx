import { useEffect, useState } from "react"
import Layout from "../components/Layout"
import { Link } from "react-router-dom"
import axios from "axios"
import { useData } from "../DataProvider"
import { useAuth } from "../components/AuthProvider"
import MyJobsSection from "../components/Dashboard/MyJobsSection"
import JobRecommendationsSection from "../components/Dashboard/JobRecommendationsSection"
import UpcomingInterviewsSection from "../components/Dashboard/UpcomingInterviewsSection"
import UserProfileSection from "../components/Dashboard/UserProfileSection"
import MessagesSection from "../components/Dashboard/MessagesSection"
import ViewsSection from "../components/Dashboard/ViewsSection"
import TopJobSection from "../components/Dashboard/TopJobSection"

function Dashboard () {
    const { baseUrl } = useData();
    const { user, toggleSaveJob } = useAuth();
    const [resumes, setResumes] = useState([]);
    const [name, setName] = useState(null);
    const [jobRecommendations, setJobRecommendations] = useState([]);
    const [topJob, setTopJob] = useState(null)

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
                    setName(response.data.data[0].firstName + ' ' + response.data.data[0].lastName);
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
                setTopJob(recommendations[0])
            } catch (error) {
                console.error('Error', error)
            }
        }
        fetchJobRecommendations()
    }, [resumes])

    return (
        <>
            <Layout>
                <div className="dashboard">
                    <header id="dashboard-header">
                        <h1>Welcome Back, {name}</h1>
                        <p>Let's make this day productive.</p>
                    </header>
                    <div className="grid-container">
                        <UserProfileSection user={user} name={name}/>
                        <section className="grid-item"></section>
                        <ViewsSection/>
                        <TopJobSection job={topJob} user={user} toggleSaveJob={toggleSaveJob}/>
                        <JobRecommendationsSection jobRecommendations={jobRecommendations} user={user} toggleSaveJob={toggleSaveJob}/>
                        <section className="grid-item"></section>
                        <section className="grid-item"></section>
                        <section className="grid-item"></section>
                    </div>
                </div>
            </Layout>
        </>
    )
}

export default Dashboard