import { useState, useCallback, useMemo } from "react";

export const useJobFilterLogic = (allResumeSkills) => {
    const [filters, setFilters] = useState({
        minMatchScore: 0,
        salary: { amount: { min: null, max: null } },
        jobTitle: '',
        location: '',
        applicationStatus: {},
        hasQuestions: false,
        datePosted: 'Anytime',
        jobType: [],
        experienceLevel: [],
        skills: [],
        industry: []
    });

    const handleFilterChange = useCallback((filterType, value, key = null) => {
        setFilters((prevFilters) => {
            switch (filterType) {
                case 'minMatchScore':
                    return { ...prevFilters, minMatchScore: parseInt(value) || 0 };

                case 'salary':
                    if (key) {
                        return {
                            ...prevFilters,
                            salary: {
                                ...prevFilters.salary,
                                amount: {
                                    ...prevFilters.salary.amount,
                                    [key]: value ? parseInt(value) : null
                                }
                            }
                        };
                    }
                    return prevFilters;

                case 'jobTitle':
                case 'location':
                    return { ...prevFilters, [filterType]: value };

                case 'applicationStatus':
                    return {
                        ...prevFilters,
                        applicationStatus: {
                            ...prevFilters.applicationStatus,
                            [value]: !prevFilters.applicationStatus[value]
                        }
                    };

                case 'hasQuestions':
                    return { ...prevFilters, hasQuestions: !prevFilters.hasQuestions };

                case 'datePosted':
                    return { ...prevFilters, datePosted: value };

                default:
                    // Array filters (jobType, experienceLevel, skills, industry)
                    const currentArray = prevFilters[filterType] || [];
                    const newArray = currentArray.includes(value)
                        ? currentArray.filter(item => item !== value)
                        : [...currentArray, value];
                    return { ...prevFilters, [filterType]: newArray };
            }
        });
    }, []);

    const handleResetFilters = useCallback(() => {
        setFilters({
            minMatchScore: 0,
            salary: { amount: { min: null, max: null } },
            jobTitle: '',
            location: '',
            applicationStatus: {},
            hasQuestions: false,
            datePosted: 'Anytime',
            jobType: [],
            experienceLevel: [],
            skills: [],
            industry: []
        });
    }, []);

    const filterTypes = useMemo(() => ({
        'Job Type': {
            filterType: 'jobType',
            choices: ['Full-Time', 'Part-Time', 'Contract', 'Internship']
        },
        'Experience Level': {
            filterType: 'experienceLevel',
            choices: ['Entry Level', 'Mid Level', 'Senior Level', 'Lead']
        },
        'Skills': {
            filterType: 'skills',
            choices: allResumeSkills
        },
        'Industry': {
            filterType: 'industry',
            choices: ['Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing']
        },
        'Application Status': {
            filterType: 'applicationStatus',
            choices: ['applied', 'interviewing', 'offered', 'rejected', 'not applied']
        }
    }), [allResumeSkills]);

    const filterRef = useMemo(() => ({ handleFilterChange }), [handleFilterChange]);

    return {
        filters,
        setFilters,
        handleFilterChange,
        handleResetFilters,
        filterTypes,
        filterRef
    };
};