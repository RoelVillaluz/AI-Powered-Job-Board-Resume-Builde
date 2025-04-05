import { useEffect, useState } from "react"
import { useAuth } from "../components/AuthProvider"
import { useData } from "../DataProvider";
import axios, { all } from "axios";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";
import JobPostingCard from "../components/JobPostingCard";

function JobPostingsList() {
    const { user } = useAuth();
    const { baseUrl, getAllData, fetchResumes, jobRecommendations, jobPostings, fetchJobRecommendations, resumes, companies } = useData();
    const allJobs = [
        ...jobRecommendations,
        ...jobPostings.filter(job => 
            !jobRecommendations.some(rec => rec._id === job._id) // filter jobs that are already present in jobRecommendations
        )
    ]

    console.log('All Jobs:', allJobs)

    useEffect(() => {
        if (user?._id) {
          fetchResumes(user._id);
        }
    }, [user]);
 
    useEffect(() => {        
        if (resumes.length > 0 ) fetchJobRecommendations()
    }, [resumes])

    useEffect(() => {
        getAllData(["companies", "job-postings"]);
    }, [])

    useEffect(() => {
        document.title = 'All Jobs'
    }, [])

    const filterTypes =  {
        // filterType = actual jobPosting fields (jobType, experienceLevel) for filtering
        "Workplace Type": {
            "choices": ["Remote", "On-Site", "Hybrid"]
        },
        "Working Schedule": {
            "choices": ['Full-Time', 'Part-Time', 'Contract', 'Internship'],
            "filterType": "jobType"
        },
        "Experience Level": {
            "choices": ['Intern', 'Entry', 'Mid-Level', 'Senior'],
            "filterType": "experienceLevel"
        }
    }
    
    return (
        <>
            <Layout>
                <div className="container">
                    <aside className="filter-sidebar">
                        <header>
                            <h3>Filters</h3>
                            <button type="reset">Clear All</button>
                        </header>
                        <ul className="filter-category-list">

                            <li>
                                <div className="filter-category">
                                    <h4>Date Posted</h4>
                                    <div className="select-wrapper">
                                        <select name="" id="date-select">
                                            <option value="">Anytime</option>
                                            <option value="">This Month</option>
                                        </select>
                                        <i className="fa-solid fa-angle-down"></i>
                                    </div>
                                </div>
                            </li>

                            <li>
                                {Object.keys(filterTypes).map((section) => (
                                    <div className="filter-category">
                                        <h4>{section}</h4>
                                        <ul className="checkbox-list">
                                            {filterTypes[section].choices.map((choice, index) => (
                                                <li key={index}>
                                                    <input type="checkbox" name="" id={`checkbox-${choice}`} />
                                                    <label htmlFor={`checkbox-${choice}`}>{choice}</label>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </li>

                            <li>
                                <div className="filter-category">
                                    <h4>Salary Range</h4>
                                    <div id="salary-range">
                                        <div>
                                            <label htmlFor="min">MIN</label>
                                            <input type="number" id="min"/>
                                        </div>
                                        <div>
                                            <label htmlFor="max">MAX</label>
                                            <input type="number" id="max"/>
                                        </div>
                                    </div>
                                </div>
                            </li>

                        </ul>
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
                                {allJobs.map((job) => (
                                    <JobPostingCard job={job}/>
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