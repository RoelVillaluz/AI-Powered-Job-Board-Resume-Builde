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
import { useUserResumesQuery } from "../hooks/resumes/useResumeQueries"
import { useEffect } from "react"

function Dashboard () {
    const user = useAuthStore(state => state.user);
    
    // Fetch user's resumes when Dashboard mounts
    const { data: resumes, isLoading: resumesLoading } = useUserResumesQuery(user?._id);

    useEffect(() => {
        document.title = 'Dashboard'
    }, [])
    
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
                                <ResumeScoreSection resumesLoading={resumesLoading} />
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