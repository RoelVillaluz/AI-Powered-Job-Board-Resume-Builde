import { useEffect, useState, useRef, useMemo } from "react"
import { useAuth } from "../contexts/AuthProvider"
import { useData } from "../contexts/DataProvider";
import axios, { all } from "axios";
import Layout from "../components/Layout";
import { Link } from "react-router-dom";
import JobPostingCard from "../components/JobPostingCard";
import FilterSidebar from "../components/FilterSidebar";
import JobSearchBar from "../components/JobListComponents/JobSearchBar";
import { useJobFilters } from "../contexts/JobsListContext";
import TopCompanies from "../components/JobListComponents/TopCompanies";
import JobPostingsListSection from "../components/JobListComponents/JobPostingsListSection";

function JobPostingsList() {
    const { user } = useAuth();
    const { baseUrl } = useData();
    const { allJobs, resumes, allResumeSkills, filterRef, filters, setFilters, handleFilterChange, handleResetFilters } = useJobFilters();

    useEffect(() => {
        document.title = 'All Jobs'
    }, [])

    return (
        <>
            <Layout>
                <div className="container" style={{ alignItems: 'start' }}>

                    <FilterSidebar user={user} filters={filters} setFilters={setFilters} allResumeSkills={allResumeSkills} ref={filterRef}/>

                    <main id="job-list-container">

                        <JobSearchBar
                            filterRef={filterRef}
                        />  

                        <TopCompanies
                            baseUrl={baseUrl}
                            user={user}
                        />

                        <JobPostingsListSection

                        />

                    </main>

                </div>
            </Layout>
        </>
    )
}

export default JobPostingsList