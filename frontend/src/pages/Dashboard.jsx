import { useEffect, useState } from "react"
import Layout from "../components/Layout"
import { Link } from "react-router-dom"
import axios from "axios"
import { useData } from "../contexts/DataProvider"
import { useAuth } from "../contexts/AuthProvider"
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
    // const { baseUrl, fetchResumes, name, resumes } = useData();
    // const user = useAuthStore(state => state.user)
    // const [loading, setLoading] = useState(true)
    // const [shuffledSkills, setShuffledSkills] = useState([])

    // useEffect(() => {
    //     document.title = 'Dashboard'
    // }, [])

    // useEffect(() => {
    //     if (user?._id) {
    //         setLoading(true); // Set loading to true before fetching
    //         fetchResumes(user._id).then(() => setLoading(false)); // Set loading to false after fetching
    //     }
    // }, [user?._id]);  // Depend only on user._id to prevent redundant fetches
    
    // // Shuffle skills only once
    // useEffect(() => {
    //     if (resumes[0]?.skills.length) {
    //         const shuffled = resumes[0].skills.sort(() => Math.random() - 0.5).slice(0, 3).map(skill => skill.name).join(", ")
    //         setShuffledSkills(shuffled)
    //     }
    // }, [resumes]) // Only trigger when resume.skills changes
    
    return (
        <>
            <Layout>
                <div className="dashboard">
                    {/* {user.role === 'jobseeker' && (
                        <>
                        <header id="dashboard-header">
                            <h1>Welcome Back, {name?.split(" ")[0]}</h1>
                            <p>Let's make this day productive.</p>
                        </header>
                        <div className="grid-container">
                            <UserProfileSection user={user} name={name}/>
                            <ResumeScoreSection baseUrl={baseUrl} resume={resumes[0]}/>
                            <TopJobSection user={user} resume={resumes[0]} shuffledSkills={shuffledSkills}/>
                            <ApplicationProgressSection user={user} baseUrl={baseUrl} loading={loading}/>
                            <SalaryPredictionSection baseUrl={baseUrl} resume={resumes[0]} loading={loading} shuffledSkills={shuffledSkills}/>
                            <GoalsSection loading={loading}/>
                            <NetworkSection user={user} baseUrl={baseUrl}/>
                            <OnlineCoursesSection user={user} baseUrl={baseUrl} loading={loading}/>
                        </div>
                        </>
                    )} */}
                </div>
            </Layout>
        </>
    )
}

export default Dashboard