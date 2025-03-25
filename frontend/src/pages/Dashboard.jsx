import { useEffect, useState } from "react"
import Layout from "../components/Layout"
import { Link } from "react-router-dom"
import axios from "axios"
import { useData } from "../DataProvider"
import { useAuth } from "../components/AuthProvider"
import ApplicationProgressSection from "../components/Dashboard/ApplicationProgressSection"
import UserProfileSection from "../components/Dashboard/UserProfileSection"
import TopJobSection from "../components/Dashboard/TopJobSection"
import OnlineCoursesSection from "../components/Dashboard/OnlineCoursesSection"
import SalaryPredictionSection from "../components/Dashboard/SalaryPredictionSection"
import ResumeScoreSection from "../components/Dashboard/ResumeScoreSection"
import GoalsSection from "../components/Dashboard/GoalsSection"
import NetworkSection from "../components/Dashboard/NetworkSection"

function Dashboard () {
    const { baseUrl, fetchResumes, name, resumes } = useData();
    const { user } = useAuth();
    const [jobRecommendations, setJobRecommendations] = useState([]);
    const [topJob, setTopJob] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        document.title = 'Dashboard'
    }, [])

    useEffect(() => {
        if (user?._id) {
          fetchResumes(user._id);
        }
      }, [user]);

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
                        <ResumeScoreSection baseUrl={baseUrl} resume={resumes[0]}/>
                        <TopJobSection job={topJob} user={user} resume={resumes[0]} loading={loading}/>
                        <ApplicationProgressSection user={user} baseUrl={baseUrl} loading={loading}/>
                        <SalaryPredictionSection resume={resumes[0]} loading={loading}/>
                        <GoalsSection/>
                        <NetworkSection/>
                        <OnlineCoursesSection user={user} baseUrl={baseUrl} loading={loading}/>
                    </div>
                </div>
            </Layout>
        </>
    )
}

export default Dashboard