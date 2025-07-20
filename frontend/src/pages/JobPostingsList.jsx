import { useEffect, useState, useRef } from "react"
import { useAuth } from "../contexts/AuthProvider"
import { useData } from "../contexts/DataProvider";
import axios, { all } from "axios";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";
import JobPostingCard from "../components/JobPostingCard";
import FilterSidebar from "../components/FilterSidebar";
import JobSearchBar from "../components/JobListComponents/JobSearchBar";
import { useJobFilters } from "../contexts/JobsListContext";

function JobPostingsList() {
    const { user } = useAuth();
    const { baseUrl } = useData();
    const { allJobs, resumes, allResumeSkills, filterRef, filters, setFilters, handleFilterChange, handleResetFilters } = useJobFilters();

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
                return [...filteredJobs].sort((a, b) => b.salary.amount - a.salary.amount)
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

                        <JobSearchBar
                            filterRef={filterRef}
                        />  

                    </main>

                </div>
            </Layout>
        </>
    )
}

export default JobPostingsList