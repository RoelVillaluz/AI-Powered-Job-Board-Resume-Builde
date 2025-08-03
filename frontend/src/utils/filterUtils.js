import { INITIAL_FILTERS, NO_FILTER_VALUE, INDUSTRY_CHOICES } from "../../../backend/constants";

// Update Filter functions
export const updateMinMatchScore = (prevFilters, value) => ({
    ...prevFilters,
    minMatchScore: parseInt(value) || NO_FILTER_VALUE
})

export const updateSalaryFilter = (prevFilters, key, value) => ({
    ...prevFilters,
    salary: {
        amount: {
            ...prevFilters.salary.amount,
            [key]: value === null ? parseInt(value) || NO_FILTER_VALUE : null
        }
    }
})

export const updateStringFilter = (prevFilters, filterType, value) => ({
    ...prevFilters,
    [filterType]: value || ""
})

export const updateApplicationStatus = (prevFilters, statusStype) => ({
    ...prevFilters,
    applicationStatus: {
        ...prevFilters.applicationStatus,
        [statusStype]: !prevFilters.applicationStatus[statusStype]
    }
})

export const updateArrayFilter = (prevFilters, filterType, value) => {
    const currentArray = prevFilters[filterType] || [];
    const isSelected = currentArray.includes(value);

    const updatedArray = isSelected
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];

    return {
        ...prevFilters,
        [filterType]: updatedArray
    }
}

export const createFilterTypes = (allResumeSkills) => ({
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
        "choices": [...Object.keys(INDUSTRY_CHOICES

    )],
        "filterType": "industry"
    }
})

// Job Filtering functions
const parseJobSalary = (salaryString) => {
    return parseFloat(String(salaryString).replace(/[^0-9.]/g, ''));
}

const checkSalaryMatch = (job, minSalary, maxSalary) => {
    const jobSalary = parseJobSalary(job.salary.amount);
    return (minSalary <= 0 || jobSalary >= minSalary) && (maxSalary <= 0 || jobSalary <= maxSalary)
}

const checkArrayFilterMatch = (filterArray, jobValue) => {
    return filterArray.length === 0 || filterArray.includes(jobValue)
}

const checkSkillsMatch = (filterSkills, jobSkills) => {
    return filterSkills.length === 0 || filterSkills.some(skill => jobSkills?.some(jobSkill => jobSkill.name === skill))
}

const checkIndustryMatch = (filterIndustries, job) => {
    return filterIndustries.length === 0 || filterIndustries.some(ind => job.company?.industry.includes(ind))
}

const checkSearchQueryMatch = (filters, job) => {
    const titleMatch = !filters.jobTitle || filters.jobTitle === '' || 
                       (job.title && job.title.toLowerCase().includes(String(filters.jobTitle).toLowerCase()))
    
    const locationMatch = !filters.location || filters.location === '' ||
                          (job.location && job.location.toLowerCase().includes(String(filters.location).toLowerCase()))

    return titleMatch && locationMatch
}

const checkApplicationStatusMatch = (filters, saved, applied) => {
    const { saved: filterSaved, applied: filterApplied } = filters.applicationStatus;

    // If neither saved nor applied are selected, allow all
    if (!filterSaved && !filterApplied) return true;

    // If only saved is selected, allow only saved jobs
    if (filterSaved && !filterApplied) return saved;

    // If only applied is selected, allow only applied jobs
    if (!filterSaved && filterApplied) return applied;

    // If both are selected, allow saved OR applied
    if (filterSaved && filterApplied) return saved || applied;
}   

const checkHasQuestionsMatch = (hasQuestionsFilter, job) => {
    // If filter is not enabled, allow all jobs
    if (!hasQuestionsFilter) return false;

    // If filter is enabled, only allow jobs with pre-screening questions
    return Array.isArray(job.preScreeningQuestions) && job.preScreeningQuestions.length > 0;
}


const areFiltersApplied = (filters) => {
    return filters.salary?.amount?.min > 0 || 
           filters.salary?.amount?.max > 0 ||
           filters.jobType.length > 0 ||
           filters.experienceLevel.length > 0 ||
           filters.skills.length > 0 ||
           filters.minMatchScore > 0 ||
           filters.applicationStatus.saved ||
           filters.applicationStatus.applied ||
           (filters.jobTitle && filters.jobTitle !== "") ||
           (filters.location && filters.location !== "") ||
           filters.industry.length > 0 ||
           filters.hasQuestions;
};

export const filterJobs = (allJobs, filters, user) => {
    if (!Array.isArray(allJobs)) return [];
    
    return allJobs.filter(job => {
        const minSalary = filters.salary.min || 0;
        const maxSalary = filters.salary.max || Number.MAX_SAFE_INTEGER;

        const saved = user.savedJobs.includes(job._id)
        const applied = user.appliedJobs.includes(job._id)

        const matchesSalary = checkSalaryMatch(job, minSalary, maxSalary)
        const matchesJobType = checkArrayFilterMatch(filters.jobType, job.jobType)
        const matchesExperienceLevel = checkArrayFilterMatch(filters.experienceLevel, job.experienceLevel)
        const matchesSkills = checkSkillsMatch(filters.skills, job.skills)
        const matchesMatchScore = filters.minMatchScore <= 0 || Number(job.similarity) >= filters.minMatchScore
        const matchesIndustry = checkIndustryMatch(filters.industry, job)
        const matchesSearchQuery = checkSearchQueryMatch(filters, job);
        const matchesApplicationStatus = checkApplicationStatusMatch(filters, saved, applied);
        const matchesHasQuestions = checkHasQuestionsMatch(filters.hasQuestions, job);

        const filtersApplied = areFiltersApplied(filters);
        
        return (
            (!filtersApplied ||
                (matchesSalary &&
                matchesJobType &&
                matchesExperienceLevel &&
                matchesSkills &&
                matchesMatchScore &&
                matchesApplicationStatus &&
                matchesIndustry &&
                matchesHasQuestions)) &&
            matchesSearchQuery
        );
    })
}