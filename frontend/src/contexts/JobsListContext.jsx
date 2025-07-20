import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from "react";
import { industryChoices } from "../../../backend/constants";
import { useData } from "./DataProvider";
import { useAuth } from "./AuthProvider";

const JobFiltersContext = createContext();
const JobsStateContext = createContext();

export const useJobFilters = () => {
    const context = useContext(JobFiltersContext)
    if (!context) {
        throw new Error('useJobFilters must be used within a JobsListProvider');
    }
    return context;
}

export const useJobsState = () => {
    const context = useContext(JobsStateContext)
    if (!context) {
        throw new Error('useJobsState must be used within a JobsListProvider');
    }
    return context
}

export const JobsListProvider = ({ children }) => {
    const { user } = useAuth();
    const { baseUrl, getAllData, fetchResumes, jobRecommendations, jobPostings, fetchJobRecommendations, resumes } = useData();

    const [loading, setLoading] = useState(true)
    const [allResumeSkills, setAllResumeSkills] = useState([]);
    const filterRef = useRef(null);
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

    useEffect(() => {        
        if (resumes.length > 0 ) fetchJobRecommendations()
    }, [resumes])

    
    useEffect(() => {
        if (user?._id) {
            fetchResumes(user._id);
        }
    }, [user]);

    useEffect(() => {
        getAllData(["job-postings"]);
    }, [])

    const allJobs = [
        ...jobRecommendations,
        ...jobPostings.filter(job => 
            !jobRecommendations.some(rec => rec._id === job._id) // filter jobs that are already present in jobRecommendations
        )
    ]

    const handleFilterChange = useCallback((filterType, value, key = null) => {
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
                        amount: {
                            ...prevFilters.salary.amount,
                            [key]: value !== null ? parseInt(value) : null
                        }
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
    }, [filters])

    const handleResetFilters = () => {
        setFilters({
            salary: {
                amount: {
                    min: 0,
                    max: 0
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
                applied: false,
            },
            industry: []
        });
    }

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
        },
        "Industry": {
            "choices": [...Object.keys(industryChoices)],
            "filterType": "industry"
        }
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
        const matchesIndustry = filters.industry.length === 0 || filters.industry.some(ind => job.company.industry.includes(ind));

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
            (filters.location && filters.location !== "") ||
            filters.industry.length > 0;
    
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
                 matchesApplicationStatus &&
                 matchesIndustry)) &&
            matchesSearchQuery
        );

    });

    const JobFiltersValue = useMemo(() => ({
        filterRef,
        filters,
        setFilters,
        handleFilterChange,
        handleResetFilters,
        filterTypes,
        filteredJobs
    }), [filterRef, filters, handleFilterChange, handleResetFilters, filterTypes, filteredJobs])

    const JobStateValue = useMemo(() => ({
        loading,
        setLoading
    }), [loading])

    return (
        <JobFiltersContext.Provider value={JobFiltersValue}>
            <JobsStateContext.Provider value={JobStateValue}>
                {children}
            </JobsStateContext.Provider>
        </JobFiltersContext.Provider>
    )
}