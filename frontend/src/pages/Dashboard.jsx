import { useEffect, useState } from "react"
import Layout from "../components/Layout"
import { Link } from "react-router-dom"
import axios from "axios"
import { useData } from "../DataProvider"
import { useAuth } from "../components/AuthProvider"
import MyJobsSection from "../components/Dashboard/MyJobsSection"
import JobRecommendationsSection from "../components/Dashboard/JobRecommendationsSection"
import ApplicationProgressSection from "../components/Dashboard/ApplicationProgressSection"
import UserProfileSection from "../components/Dashboard/UserProfileSection"
import MessagesSection from "../components/Dashboard/MessagesSection"
import ViewsSection from "../components/Dashboard/ViewsSection"
import TopJobSection from "../components/Dashboard/TopJobSection"
import OnlineCoursesSection from "../components/Dashboard/OnlineCoursesSection"
import UserStreakSection from "../components/Dashboard/UserStreakSection"

function Dashboard () {
    const { baseUrl } = useData();
    const { user, toggleSaveJob } = useAuth();
    const [resumes, setResumes] = useState([]);
    const [name, setName] = useState(null);
    const [jobRecommendations, setJobRecommendations] = useState([]);
    const [topJob, setTopJob] = useState(null)
    const [loading, setLoading] = useState(true)

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
                    console.log('Skills:', response.data.data[0].skills)
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
                setTopJob(recommendations[0] || null)
            } catch (error) {
                console.error('Error', error)
            } finally {
                setLoading(false)
            }
        }
        if (resumes.length > 0 ) fetchJobRecommendations()
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
                        <UserProfileSection user={user} name={name} loading={loading}/>
                        <MessagesSection loading={loading}/>
                        <ViewsSection loading={loading}/>
                        <TopJobSection job={topJob} user={user} toggleSaveJob={toggleSaveJob} loading={loading}/>
                        <JobRecommendationsSection jobRecommendations={jobRecommendations} loading={loading}/>
                        <UserStreakSection user={user} baseUrl={baseUrl} loading={loading}/>
                        <section className="grid-item"></section>
                        <ApplicationProgressSection user={user} baseUrl={baseUrl} loading={loading}/>
                        <OnlineCoursesSection user={user} baseUrl={baseUrl} loading={loading}/>
                    </div>
                </div>
            </Layout>
        </>
    )
}

export default Dashboard