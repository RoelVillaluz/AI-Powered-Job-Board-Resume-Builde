import { useEffect, useState, useRef } from "react"
import { useAuth } from "../components/AuthProvider"
import { useData } from "../DataProvider";
import axios, { all } from "axios";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";
import JobPostingCard from "../components/JobPostingCard";
import FilterSidebar from "../components/FilterSidebar";
import { industryChoices } from "../../../backend/constants";

function JobPostingsList() {
    const { user } = useAuth();
    const { baseUrl, getAllData, fetchResumes, jobRecommendations, jobPostings, fetchJobRecommendations, resumes } = useData();
    const filterRef = useRef(null);

    const [allResumeSkills, setAllResumeSkills] = useState([]);
    const [recentSearches, setRecentSearches] = useState(new Set());
    const [recommendedCompanies, setRecommendedCompanies] = useState([]);

    const [loading, setLoading] = useState(true)
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const dropdownRef = useRef(null);
    // Add a ref to track if a sort button was clicked
    const sortButtonClickedRef = useRef(false);

    const [searchQuery, setSearchQuery] = useState({
        jobTitle: "",
        location: ""
    })
    const [filters, setFilters] = useState({
        salary: {
            amount: {
                min: 0,
                max: 0,
            }
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
        },
        industry: []
    })

    const sortTypes = ['Best Match (Default)', 'A-Z', 'Z-A', 'Newest First', 'Highest Salary']
    const [currentSortType, setCurrentSortType] = useState('Best Match (Default)')

    const allJobs = [
        ...jobRecommendations,
        ...jobPostings.filter(job => 
            !jobRecommendations.some(rec => rec._id === job._id) // filter jobs that are already present in jobRecommendations
        )
    ]

    const combineResumeSkills = () => {
        const resumeSkills = resumes.map((resume) => resume.skills.map((skill) => skill.name)).flat()
        const uniqueSkills = [...new Set(resumeSkills)]

        setAllResumeSkills(uniqueSkills)
    } 

    const filteredJobs = allJobs.filter(job => {
        // Check if job matches all the filters
        const minSalary = filters.salary.amount.min || 0;
        const maxSalary = filters.salary.amount.max || Number.MAX_SAFE_INTEGER;

        const saved = user.savedJobs.includes(job._id)
        const applied = user.appliedJobs.includes(job._id)
    
        const matchesSalary =
            (minSalary <= 0 || parseFloat(String(job.salary.amount).replace(/[^0-9.]/g, '')) >= minSalary) &&
            (maxSalary <= 0 || parseFloat(String(job.salary.amount).replace(/[^0-9.]/g, '')) <= maxSalary);
        
        const matchesJobType = filters.jobType.length === 0 || filters.jobType.includes(job.jobType);
        const matchesExperienceLevel = filters.experienceLevel.length === 0 || filters.experienceLevel.includes(job.experienceLevel);
        const matchesSkills = filters.skills.length === 0 || filters.skills.some(skill => job.skills?.some(jobSkill => jobSkill.name === skill));
        const matchesMatchScore = filters.minMatchScore <= 0 || Number(job.similarity) >= filters.minMatchScore;

        // Check if any filters are applied
        const filtersApplied = 
            filters.salary?.amount?.min > 0 || filters.salary?.amount?.max > 0 ||
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
            filterRef.current.handleFilterChange('jobTitle', queryToSubmit.jobTitle)
        }

        if (queryToSubmit.location) {
            filterRef.current.handleFilterChange('location', queryToSubmit.location)
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

    const handleSortButtonClick = (e, type) => {
        e.stopPropagation();
        // Set the ref to true to indicate a sort button was clicked
        sortButtonClickedRef.current = true;
        setCurrentSortType(type);
        setIsDropdownVisible(false);
        console.log("Sort type changed to:", type);
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

    // Modified handleClickOutside to respect sort button clicks
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sortButtonClickedRef.current) {
                sortButtonClickedRef.current = false;
                return;
            }
            
            // Otherwise proceed with normal outside click handling
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownVisible(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const getSortedJobs = () => {
        switch (currentSortType) {
            case "A-Z":
                return [...filteredJobs].sort((a, b) => a.title.localeCompare(b.title))
            case "Z-A":
                return [...filteredJobs].sort((a, b) => b.title.localeCompare(a.title))
            case "Newest First":
                return [...filteredJobs].sort((a, b) => b.postedAt.localeCompare(a.postedAt))
            case "Highest Salary":
                return [...filteredJobs].sort((a, b) => b.salary - a.salary)
            default:
                return filteredJobs // no need to explicitly sort by similarity, already done in the api backend
        }
    }
        

    return (
        <>
            <Layout>
                <div className="container" style={{ alignItems: 'start' }}>

                    <FilterSidebar filters={filters} setFilters={setFilters} allResumeSkills={allResumeSkills} ref={filterRef}/>

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
                                <div className="sorter" ref={dropdownRef}>
                                    <h4>Sort by: <span className="sort-type">{currentSortType}</span></h4>
                                    <button className="sort-toggle" onClick={(e) => {
                                        e.stopPropagation();  
                                        setIsDropdownVisible(prev => !prev);
                                    }} aria-label="Toggle sort options">
                                        <i className="fa-solid fa-sort"></i>
                                    </button>
                                    <ul style={{ display: isDropdownVisible ? 'flex': 'none' }}>
                                        {sortTypes.map((type, index) => (
                                            <li key={index} className={type === currentSortType ? 'active': ''}>
                                                <button onClick={(e) => handleSortButtonClick(e, type)}>{type}</button>
                                                {type === currentSortType && (
                                                    <i className="fa-solid fa-check"></i>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </header>
                            <ul>
                                {getSortedJobs().map((job) => (
                                    <JobPostingCard job={job} user={user} key={job._id}/>
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