import { useEffect, useState } from "react"
import Layout from "../components/Layout"
import { useAuthStore } from "../stores/authStore"
import { useResumeStore } from "../stores/resumeStore"
import ApplicationProgressSection from "../components/Dashboard/ApplicationProgressSection"
import UserProfileSection from "../components/Dashboard/UserProfileSection"
import TopJobSection from "../components/Dashboard/TopJobSection"
import OnlineCoursesSection from "../components/Dashboard/OnlineCoursesSection"
import SalaryPredictionSection from "../components/Dashboard/SalaryPredictionSection"
import ResumeScoreSection from "../components/Dashboard/ResumeScoreSection"
import GoalsSection from "../components/Dashboard/GoalsSection"
import NetworkSection from "../components/Dashboard/NetworkSection"

function Dashboard () {
    const user = useAuthStore(state => state.user);
    const fetchResumes = useResumeStore(state => state.fetchResumes); 

    useEffect(() => {
        document.title = 'Dashboard'
        
        // Fetch resumes when dashboard loads
        if (user?._id) {
            fetchResumes(user._id);
        }
    }, [user?._id, fetchResumes])
    
    return (
        <>
            <Layout>
                <div className="dashboard">
                    {user && user.role === 'jobseeker' && (
                        <>
                        <header id="dashboard-header">
                            <h1>Welcome Back, {user.firstName}</h1>
                            <p>Let's make this day productive.</p>
                        </header>
                        <div className="grid-container">
                            <UserProfileSection/>
                            <ResumeScoreSection/>
                            <TopJobSection/>
                            <ApplicationProgressSection/>
                            <SalaryPredictionSection/>
                            <GoalsSection/>
                            <NetworkSection/>
                            <OnlineCoursesSection/>
                        </div>
                        </>
                    )}
                </div>
            </Layout>
        </>
    )
}

export default Dashboard