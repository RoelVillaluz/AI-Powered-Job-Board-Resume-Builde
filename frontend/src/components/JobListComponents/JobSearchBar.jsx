import { useState, useMemo, useCallback, useRef } from "react";

function JobSearchBar({ filterRef }) {
    const [recentSearches, setRecentSearches] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState({
        jobTitle: "",
        location: ""
    })

    const handleSearchQueryChange = (value, field) => {
        setSearchQuery((prevQuery) => ({
            ...prevQuery,
            [field]: value
        }));
    };

    const handleSearchSubmit = useCallback((e, buttonQuery = null) => {
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
    })

    const recentSearchesList = useMemo(() => {
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
    }, [recentSearches])

    return (
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
                    {recentSearchesList}
                </ul>
            </div>
        </section>
    )
}

export default JobSearchBar