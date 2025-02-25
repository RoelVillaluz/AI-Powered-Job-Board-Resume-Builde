import { useEffect } from "react"
import Layout from "../components/Layout"
import { Link } from "react-router-dom"

function Dashboard () {

    useEffect(() => {
        document.title = 'Dashboard'
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
                            <Link>
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
                            <Link>
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
                            <Link>
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
                            <Link>
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