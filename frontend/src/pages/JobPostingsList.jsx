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
    const [allResumeSkills, setAllResumeSkills] = useState([]);
    const [hiddenSections, setHiddenSections] = useState([]);
    const [minMatchScore, setMinMatchScore] = useState(50);

    const allJobs = [
        ...jobRecommendations,
        ...jobPostings.filter(job => 
            !jobRecommendations.some(rec => rec._id === job._id) // filter jobs that are already present in jobRecommendations
        )
    ]

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
        },
        "Your Skills": {
            "choices": allResumeSkills,
            "filterType": "skills"
        }
    }

    const filteredJobs = allJobs.filter(job => {
        const matchedJobs = []

        if (filters.jobType.length > 0) {
            matchedJobs.push(filters.jobType.includes(job.jobType))
        }

        if (filters.experienceLevel.length > 0) {
            matchedJobs.push(filters.experienceLevel.includes(job.experienceLevel))
        }

        if (filters.skills.length > 0) {
            matchedJobs.push(filters.skills.some(skill => job.skills.some(jobSkill => jobSkill.name === skill)))
        }

        const filtersApplied = filters.jobType.length > 0 || filters.experienceLevel.length > 0 || filters.skills.length > 0;
    
        return filtersApplied ? matchedJobs.includes(true) : allJobs
    })

    const combineResumeSkills = () => {
        const resumeSkills = resumes.map((resume) => resume.skills.map((skill) => skill.name)).flat()
        const uniqueSkills = [...new Set(resumeSkills)]

        setAllResumeSkills(uniqueSkills)
    } 

    const toggleVisibility = (section) => {
        setHiddenSections((prevState) => ({
            ...prevState,
            [section]: !prevState[section]
        }))
    }

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

    useEffect(() => {
        combineResumeSkills()
    }, [resumes])
    
    return (
        <>
            <Layout>
                <div className="container" style={{ alignItems: 'start' }}>
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
                                        <select name="" id="date-select">$
                                            <option value="">Anytime</option>
                                            <option value="">This Month</option>
                                        </select>
                                        <i className="fa-solid fa-angle-down"></i>
                                    </div>
                                </div>
                            </li>

                            <li>
                                <div className="filter-category">
                                    <h4>Salary Range</h4>
                                    <div className="min-max-container">
                                        <div>
                                            <label htmlFor="min-salary">MIN</label>
                                            <input type="number" id="min-salary"/>
                                        </div>
                                        <div>
                                            <label htmlFor="max-salary">MAX</label>
                                            <input type="number" id="max-salary"/>
                                        </div>
                                    </div>
                                </div>
                            </li>

                            <li className="filter-category">
                                <h4>Match Score</h4>
                                <div className="range-slider">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={minMatchScore}
                                        onChange={(e) => setMinMatchScore(e.target.value)}
                                        className="slider"
                                    />
                                    <div
                                        className="custom-thumb"
                                        style={{
                                            left: `calc(${Math.max(minMatchScore, 15)}% - 15px)`, // Ensure a minimum of 1%
                                        }}
                                    >
                                        {minMatchScore}
                                    </div>
                                </div>
                            </li>

                            <li>
                                {Object.keys(filterTypes).map((section) => (
                                    <div className="filter-category">
                                        <div className="wrapper">
                                            <h4>{section}</h4>
                                            <i className={`fa-solid fa-angle-${!hiddenSections[section] ? 'up' : 'down'}`} onClick={() => toggleVisibility(section)}></i>
                                        </div>
                                        {!hiddenSections[section] && (
                                            <ul className="checkbox-list">
                                                {filterTypes[section].choices.map((choice, index) => (
                                                    <li key={index}>
                                                        <input type="checkbox" name="" id={`checkbox-${choice}`} onClick={() => handleFilterChange(filterTypes[section].filterType, choice)}/>
                                                        <label htmlFor={`checkbox-${choice}`}>{choice}</label>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </li>

                        </ul>
                    </aside>

                    <main id="job-list-container">
                        {/* <section id="top-companies">
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
                        </section> */}
                        <section id="job-posting-list">
                            <header>
                                <h1>Recommended Jobs ({allJobs.length})</h1>
                                <div className="sorter">
                                    <i className="fa-solid fa-sort"></i>
                                </div>
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