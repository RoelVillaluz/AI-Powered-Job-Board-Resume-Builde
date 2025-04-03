import { useEffect, useState } from "react"
import { useAuth } from "../components/AuthProvider"
import { useData } from "../DataProvider";
import axios from "axios";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";

function JobPostingsList() {
    const { user } = useAuth();
    const { baseUrl, getAllData, fetchResumes, jobRecommendations, fetchJobRecommendations, resumes, companies } = useData();

    useEffect(() => {
        if (user?._id) {
          fetchResumes(user._id);
        }
    }, [user]);
 
    useEffect(() => {        
        if (resumes.length > 0 ) fetchJobRecommendations()
    }, [resumes])

    useEffect(() => {
        getAllData(["companies"])
        console.log("Companies:", companies)
    }, [])

    useEffect(() => {
        document.title = 'All Jobs'
    }, [])

    return (
        <>
            <Layout>
                <div className="container">
                    <aside id="job-filter-sidebar">
                        <h3>Filters</h3>
                    </aside>
                    <main id="job-list-container">
                        <section id="top-companies">
                            <header>
                                <div>
                                    <h1>Top Companies</h1>
                                    <h3>Based on your industry</h3>
                                </div>
                                <Link>View All<i className="fa-solid fa-angle-right"></i></Link>
                            </header>
                            <ul>
                                {companies.map((company) => (
                                    <li key={company._id}>
                                        <Link to={`companies/${company._id}`}>
                                            {company.logo ? (
                                                <img src={company.logo} alt="" />
                                            ) : (
                                                <i className="fa-solid fa-building"></i>
                                            )}
                                            <h3>{company.name}</h3>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                        <section id="job-posting-list">
                            <header>
                                <h1>Recommended Jobs</h1>
                            </header>
                            <ul>
                                {jobRecommendations.map((job) => (
                                    <li key={job._id}>
                                        <Link to={`job-postings/${job._id}`}>
                                            <div className="wrapper">
                                                <img src={job.company.logo} alt="" />
                                                <div>
                                                    <h2>{job.title}</h2>
                                                    <h3>{job.company.name}</h3>
                                                </div>
                                            </div>
                                            <h4>${job.salary}</h4>
                                            <p>{job.summary}</p>

                                            <div className="details">
                                                <div className="tags-list">
                                                    <div className="tag-item">
                                                        <i className="fa-solid fa-location-dot" aria-hidden="true"></i>
                                                        <span>{job.location}</span>
                                                    </div>
                                                    <div className="tag-item">
                                                        <i className="fa-solid fa-briefcase" aria-hidden="true"></i>
                                                        <span>{job.jobType}</span>
                                                    </div>
                                                    <div className="tag-item">
                                                        <i className="fa-solid fa-user-tie" aria-hidden="true"></i>
                                                        <span>{job.experienceLevel}</span>
                                                    </div>
                                                </div>
                                                
                                                <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Iste, veniam labore! Aspernatur culpa alias illum autem ipsa harum laudantium adipisci omnis minus quibusdam similique, eveniet accusantium excepturi aliquam a praesentium!</p>

                                                <div className="actions">

                                                    <button id="apply-btn">Apply</button>
                                                    <button id="save-btn">
                                                        <i className='fa-solid fa-bookmark'></i>
                                                    </button>
                                                    <div className="match-score">
                                                        {job.similarity}% Match
                                                    </div>
                                                </div>
                                            </div>

                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </main>
                </div>
            </Layout>
        </>
    )
}

export default JobPostingsList