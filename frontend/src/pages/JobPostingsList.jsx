import { useEffect, useState, useRef } from "react"
import { useAuth } from "../components/AuthProvider"
import { useData } from "../DataProvider";
import axios, { all } from "axios";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";
import JobPostingCard from "../components/JobPostingCard";

function JobPostingsList() {
    const { user } = useAuth();
    const { baseUrl, getAllData, fetchResumes, jobRecommendations, jobPostings, fetchJobRecommendations, resumes } = useData();
    const [allResumeSkills, setAllResumeSkills] = useState([]);
    const [hiddenSections, setHiddenSections] = useState([]);
    const [recentSearches, setRecentSearches] = useState(new Set());
    const [recommendedCompanies, setRecommendedCompanies] = useState([]);
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState({
        jobTitle: "",
        location: ""
    })

    const [filters, setFilters] = useState({
        salary: {
            min: 0,
            max: 0,
        },
        jobType: [],
        experienceLevel: [],
        skills: [],
        minMatchScore: 0,
        jobTitle: "",
        location: "",
        applicationStatus: {
            saved: false,
            applied: false
        }
    })

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
        },
        "Application Status": {
            "choices": ['saved', 'applied'],
            "filterType": "applicationStatus"
        }
    }

    const filteredJobs = allJobs.filter(job => {
        // Check if job matches all the filters
        const minSalary = filters.salary.min || 0;
        const maxSalary = filters.salary.max || Number.MAX_SAFE_INTEGER;

        const saved = user.savedJobs.includes(job._id)
        const applied = user.appliedJobs.includes(job._id)
    
        const matchesSalary =
            (minSalary <= 0 || parseFloat(String(job.salary).replace(/[^0-9.]/g, '')) >= minSalary) &&
            (maxSalary <= 0 || parseFloat(String(job.salary).replace(/[^0-9.]/g, '')) <= maxSalary);
        
        const matchesJobType = filters.jobType.length === 0 || filters.jobType.includes(job.jobType);
        const matchesExperienceLevel = filters.experienceLevel.length === 0 || filters.experienceLevel.includes(job.experienceLevel);
        const matchesSkills = filters.skills.length === 0 || filters.skills.some(skill => job.skills?.some(jobSkill => jobSkill.name === skill));
        const matchesMatchScore = filters.minMatchScore <= 0 || Number(job.similarity) >= filters.minMatchScore;

        // Check if any filters are applied
        const filtersApplied = 
            filters.salary.min > 0 || filters.salary.max > 0 ||
            filters.jobType.length > 0 ||
            filters.experienceLevel.length > 0 ||
            filters.skills.length > 0 ||
            filters.minMatchScore > 0 ||
            filters.applicationStatus.saved ||
            filters.applicationStatus.applied ||
            (filters.jobTitle && filters.jobTitle !== "") ||
            (filters.location && filters.location !== "");
    
        // Fixed search query matching to handle undefined values safely
        const matchesSearchQuery = 
            (!filters.jobTitle || filters.jobTitle === "" || 
             (job.title && job.title.toLowerCase().includes(String(filters.jobTitle).toLowerCase()))) &&
            (!filters.location || filters.location === "" || 
             (job.location && job.location.toLowerCase().includes(String(filters.location).toLowerCase())));

        const matchesApplicationStatus = (() => {
            const { saved: filterSaved, applied: filterApplied } = filters.applicationStatus;

            // If neither saved nor applied are selected, allow all
            if (!filterSaved && !filterApplied) return true;

            // If only saved is selected, allow only saved jobs
            if (filterSaved && !filterApplied) return saved;

            // If only applied is selected, allow only applied jobs
            if (!filterSaved && filterApplied) return applied;

            // If both are selected, allow saved OR applied
            if (filterSaved && filterApplied) return saved || applied;
        })();
        
        // Return job if it matches all relevant filters
        return (
            (!filtersApplied ||
                (matchesSalary &&
                 matchesJobType &&
                 matchesExperienceLevel &&
                 matchesSkills &&
                 matchesMatchScore &&
                 matchesApplicationStatus)) &&
            matchesSearchQuery
        );

    });

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

    const handleFilterChange = (filterType, value, key = null) => {
        setFilters((prevFilters) => {
            if (filterType === 'minMatchScore') {
                return {
                    ...prevFilters,
                    minMatchScore: parseInt(value)
                }
            } else if (filterType === 'salary' && key) {
                return {
                    ...prevFilters,
                    salary: {
                        ...prevFilters.salary,
                        [key]: value !== null ? parseInt(value) : null
                    }
                }
            } else if (filterType === 'jobTitle' || filterType === 'location') {
                // Handle string values for search
                return {
                    ...prevFilters,
                    [filterType]: value
                };
            } else if (filterType === 'applicationStatus') {
                return {
                    ...prevFilters,
                    applicationStatus: {
                        ...prevFilters.applicationStatus,
                        [value]: !prevFilters.applicationStatus[value]
                    }
                }
            }
    

            const updatedFilterValues = prevFilters[filterType].includes(value)
                ? prevFilters[filterType].filter(item => item !== value)
                : [...prevFilters[filterType], value]

            return { ...prevFilters, [filterType]: updatedFilterValues };
        })
    } 

    const handleResetFilters = () => {
        setFilters({
            jobType: [],
            experienceLevel: [],
            skills: [],
            minMatchScore: 0,
            applicationStatus: {
                saved: false,
                applied: false,
            }
        })
    }

    const handleSearchQueryChange = (value, field) => {
        setSearchQuery((prevQuery) => ({
            ...prevQuery,
            [field]: value
        }));
    };

    const handleSearchSubmit = (e, buttonQuery = null) => {
        e.preventDefault();

        const queryToSubmit = buttonQuery || searchQuery

        if (queryToSubmit.jobTitle) {
            handleFilterChange('jobTitle', queryToSubmit.jobTitle)
        }

        if (queryToSubmit.location) {
            handleFilterChange('location', queryToSubmit.location)
        }

        // create unique key so similar search queries but different types (jobTitle vs location) don't get recognized as same element 
        const searchKey = `${queryToSubmit.jobTitle}|${queryToSubmit.location}`

        setRecentSearches(prevSearches => {
            const updatedSearches = new Set(prevSearches)
            updatedSearches.add(searchKey)
            return updatedSearches
        })

        setSearchQuery({
            jobTitle: "",
            location: ""
        });
    }

    const recentSearchesList = () => {
        const searchesArray = Array.from(recentSearches).map(key => {
            const [jobTitle, location] = key.split('|') // remove "|" from `${queryToSubmit.jobTitle}|${queryToSubmit.location}`
            return { jobTitle, location }
        })

        return searchesArray.map((search, index) => (
            <li key={index}>
                <button>
                    <i className={`fa-solid fa-${search.jobTitle ? 'briefcase': 'location-dot'}`}></i>
                    {search.jobTitle || search.location}
                </button>
            </li>
        ))
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
        getAllData(["job-postings"]);
    }, [])

    useEffect(() => {
        document.title = 'All Jobs'
    }, [])

    useEffect(() => {
        combineResumeSkills()
    }, [resumes])

    useEffect(() => {
        const fetchRecommendedCompanies = async () => {
            try {
                const response = await axios.get(`${baseUrl}/ai/recommend-companies/${user._id}`)

                console.log(response.data.recommended_companies)
                setRecommendedCompanies(response.data.recommended_companies)
            } catch (error) {
                console.error('Error', error)
            } finally {
                setLoading(false)
            }
        }
        fetchRecommendedCompanies()
    }, [user._id])
        
    return (
        <>
            <Layout>
                <div className="container" style={{ alignItems: 'start' }}>
                    <aside className="filter-sidebar">
                        <header>
                            <h3>Filters</h3>
                            <button type="reset" onClick={() => handleResetFilters()}>Clear All</button>
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
                                            <input type="number" 
                                                id="min-salary"
                                                value={filters.salary.min ?? ''} 
                                                onChange={(e) => handleFilterChange("salary", e.target.value, "min")}/>
                                        </div>
                                        <div>
                                            <label htmlFor="max-salary">MAX</label>
                                            <input type="number" 
                                                id="max-salary"
                                                value={filters.salary.max ?? ''}
                                                onChange={(e) => handleFilterChange("salary", e.target.value, "max")}/>
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
                                        value={filters.minMatchScore}
                                        onChange={(e) => handleFilterChange("minMatchScore", e.target.value)}
                                        className="slider"
                                    />
                                    <div
                                        className="custom-thumb"
                                        style={{
                                            left: `calc(${Math.max(filters.minMatchScore, 15)}% - 15px)`, 
                                        }}
                                    >
                                        {filters.minMatchScore}
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
                                                        <input
                                                            type="checkbox"
                                                            id={`checkbox-${choice}`}
                                                            checked={
                                                                filterTypes[section].filterType === 'applicationStatus'
                                                                    ? filters.applicationStatus[choice] || false
                                                                    : filters[filterTypes[section].filterType]?.includes(choice) || false
                                                            }
                                                            onChange={() => handleFilterChange(filterTypes[section].filterType, choice)}
                                                        />
                                                        <label htmlFor={`checkbox-${choice}`}>{choice.charAt(0).toUpperCase() + choice.slice(1)}</label>
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
                        <section id="search-job-section">
                            <h1>Find Your Next Opportunity</h1>
                            <p>Search thousands of job listings by title, keyword, or location and take the next step in your career journey.</p>

                            <img src="media/search-bar-illustration.png" alt="" aria-hidden="true" />

                            <form className="job-search-bar" onSubmit={handleSearchSubmit}>
                                <div id="search-by-job-title">
                                    <input type="text" 
                                            placeholder="Job title or keyword" 
                                            value={searchQuery.jobTitle}
                                            onChange={(e) => handleSearchQueryChange(e.target.value, "jobTitle")}/>
                                    <i className="fa-solid fa-magnifying-glass"></i>
                                </div>
                                <div id="search-by-location">
                                    <input type="text" 
                                            placeholder="Add country or city" 
                                            value={searchQuery.location}
                                            onChange={(e) => handleSearchQueryChange(e.target.value, "location")}/>
                                    <i className="fa-solid fa-map-location-dot"></i>
                                </div>
                                <button>Search</button>
                            </form>
                            <div id="recent-searches">
                                <h4>Recent Searches: </h4>
                                <ul>
                                    {recentSearchesList()}
                                </ul>
                            </div>
                        </section>
                        <section id="top-companies">
                            <header>
                                <h2>Top Companies</h2>
                            </header>
                            <ul>
                                {!loading && recommendedCompanies.map((company) => (
                                    <li key={company._id}>
                                        <Link to={`/companies/${company._id}`}>
                                            {company.logo ? (
                                                <img src={company.logo} alt="" />
                                            ) : (
                                                <i className="fa-solid fa-building"></i>
                                            )}
                                            <h4>{company.name}</h4>
                                            <h5><i className="fa-solid fa-star"></i>{company.rating}.0</h5>
                                        </Link>
                                    </li>
                                ))}
                                {loading && (
                                    Array.from({ length: 7 }).map((_, index) => (
                                        <li key={index} className="skeleton"></li>
                                    ))
                                )}
                            </ul>
                        </section>
                        <section id="job-posting-list">
                            <header>
                                <h2>Recommended jobs <span className="filtered-jobs-count">{filteredJobs.length}</span></h2>
                                <div className="sorter">
                                    <h4>Sort by: <span className="sort-type">Default</span></h4>
                                    <i className="fa-solid fa-sort"></i>
                                </div>
                            </header>
                            <ul>
                                {filteredJobs.map((job) => (
                                    <JobPostingCard job={job} user={user}/>
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