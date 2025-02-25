import { useEffect, useState } from "react"
import Layout from "../components/Layout"
import { Link } from "react-router-dom"
import axios from "axios"
import { useData } from "../DataProvider"
import { useAuth } from "../components/AuthProvider"

function Dashboard () {
    const { baseUrl } = useData();
    const { user } = useAuth();
    const [resumes, setResumes] = useState([]);

    useEffect(() => {
        document.title = 'Dashboard'
    }, [])
    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const response = await axios.get(`${baseUrl}/resumes/user/${user._id}`)
                console.log('Resumes:', response.data)
                setResumes(response.data.data)
            } catch (error) {
                console.error('Error', error)
            }
        }
        fetchResumes()
    }, [])

    return (
        <>
            <Layout>
                <main className="dashboard">
                    <section className="grid-item" id="my-jobs">
                        <header>
                            <h3>My Jobs</h3>
                            <Link>
                                <i className="fa-solid fa-angle-right"></i>
                            </Link>
                        </header>
                        <ul>
                            <Link to={'/my-jobs/saved'}>
                                <li>
                                    <div className="row">
                                        <i className="fa-solid fa-bookmark"></i>
                                        <div>
                                            <strong>Saved</strong>
                                            <p>(0) jobs</p>
                                        </div>
                                    </div>
                                    <i className="fa-solid fa-angle-right"></i>
                                </li>
                            </Link>
                            <Link to={'/my-jobs/applied'}>
                                <li>
                                    <div className="row">
                                        <i className="fa-solid fa-file-invoice"></i>
                                        <div>
                                            <strong>Applied</strong>
                                            <p>(0) jobs</p>
                                        </div>
                                    </div>
                                    <i className="fa-solid fa-angle-right"></i>
                                </li>
                            </Link>
                            <Link to={'/my-jobs/interviews'}>
                                <li>
                                    <div className="row">
                                        <i className="fa-solid fa-clipboard-question"></i>
                                        <div>
                                            <strong>Interviews</strong>
                                            <p>(0) jobs</p>
                                        </div>
                                    </div>
                                    <i className="fa-solid fa-angle-right"></i>
                                </li>
                            </Link>
                            <Link to={'/my-jobs/offers'}>
                                <li>
                                    <div className="row">
                                        <i className="fa-solid fa-briefcase"></i>
                                        <div>
                                            <strong>Offers</strong>
                                            <p>(0) jobs</p>
                                        </div>
                                    </div>
                                    <i className="fa-solid fa-angle-right"></i>
                                </li>
                            </Link>
                        </ul>
                    </section>  
                </main>
            </Layout>
        </>
    )
}

export default Dashboard