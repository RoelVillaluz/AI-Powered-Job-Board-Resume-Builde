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
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        document.title = 'Dashboard'
    }, [])

    useEffect(() => {
        if (user?._id) {
            setLoading(true); // Set loading to true before fetching
            fetchResumes(user._id).then(() => setLoading(false)); // Set loading to false after fetching
        }
    }, [user]);
    
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
                        <ResumeScoreSection baseUrl={baseUrl} resume={resumes[0]}/>
                        <TopJobSection user={user} resume={resumes[0]}/>
                        <ApplicationProgressSection user={user} baseUrl={baseUrl} loading={loading}/>
                        <SalaryPredictionSection baseUrl={baseUrl} resume={resumes[0]} loading={loading}/>
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