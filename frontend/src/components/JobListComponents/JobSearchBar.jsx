import { useState, useMemo, useCallback, useRef } from "react";
import { useJobStore } from "../../stores/jobStore";

function JobSearchBar({ filterRef }) {
    const { updateFilter } = useJobStore();
    const [recentSearches, setRecentSearches] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState({
        jobTitle: "",
        location: ""
    });

    const handleSearchQueryChange = (value, field) => {
        setSearchQuery((prevQuery) => ({
            ...prevQuery,
            [field]: value
        }));
    };

    const handleSearchSubmit = useCallback((e, buttonQuery = null) => {
        e.preventDefault();

        const queryToSubmit = buttonQuery || searchQuery;

        // Update Zustand filters directly
        updateFilter("jobTitle", queryToSubmit.jobTitle || "");
        updateFilter("location", queryToSubmit.location || "");

        const searchKey = `${queryToSubmit.jobTitle}|${queryToSubmit.location}`;

        setRecentSearches(prev => {
            const next = new Set(prev);
            next.add(searchKey);
            return next;
        });

        setSearchQuery({ jobTitle: "", location: "" });
    }, [searchQuery, updateFilter]);

    const handleRecentSearchClick = useCallback((search, e) => {
        handleSearchSubmit(e, search);
    }, [handleSearchSubmit]);

    const recentSearchesList = useMemo(() => {
        const searchesArray = Array.from(recentSearches).map(key => {
            const [jobTitle, location] = key.split('|');
            return { jobTitle, location };
        });

        return searchesArray.map((search, index) => (
            <li key={index}>
                <button onClick={(e) => handleRecentSearchClick(search, e)}>
                    <i className={`fa-solid fa-${search.jobTitle ? 'briefcase': 'location-dot'}`}></i>
                    {search.jobTitle || search.location}
                </button>
            </li>
        ));
    }, [recentSearches, handleRecentSearchClick]);

    return (
        <section id="search-job-section">
            <h1>Find Your Next Opportunity</h1>
            <p>Search thousands of job listings by title, keyword, or location and take the next step in your career journey.</p>

            <img src="media/search-bar-illustration.webp" alt="" aria-hidden="true" />

            <form className="job-search-bar" onSubmit={handleSearchSubmit}>
                <div id="search-by-job-title">
                    <input 
                        type="text" 
                        placeholder="Job title or keyword" 
                        value={searchQuery.jobTitle}
                        onChange={(e) => handleSearchQueryChange(e.target.value, "jobTitle")}
                    />
                    <i className="fa-solid fa-magnifying-glass"></i>
                </div>
                <div id="search-by-location">
                    <input 
                        type="text" 
                        placeholder="Add country or city" 
                        value={searchQuery.location}
                        onChange={(e) => handleSearchQueryChange(e.target.value, "location")}
                    />
                    <i className="fa-solid fa-map-location-dot"></i>
                </div>
                <button type="submit">Search</button>
            </form>
            {recentSearchesList.length > 0 && (
                <div id="recent-searches">
                    <h2>Recent Searches: </h2>
                    <ul>
                        {recentSearchesList}
                    </ul>
                </div>
            )}
        </section>
    );
}

export default JobSearchBar;