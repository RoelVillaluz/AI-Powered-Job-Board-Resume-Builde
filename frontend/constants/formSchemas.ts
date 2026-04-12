import type { CreateJobFormData } from "../types/forms/createJobForm.types";
import type { JobseekerFormData, EmployerFormData } from "../types/forms/getStartedForm.types";

export const JOBSEEKER_INITIAL_FORM_DATA: Omit<JobseekerFormData, 'user'> = {
    firstName: "",
    lastName: "",
    jobTitle: "",
    phone: "",
    address: "",
    summary: "",
    skills: [],
    workExperience: [],
    certifications: [],
    socialMedia: {
        facebook: "",
        linkedIn: "",
        github: "",
        website: "",
    },
};

export const COMPANY_INITIAL_FORM_DATA: Omit<EmployerFormData, 'user'> = {
    name: "",
    industry: [],
    location: "",
    website: "",
    size: "",
    description: "",
    logo: "",
};

export const CREATE_JOB_INITIAL_FORM_DATA: CreateJobFormData = {
    title: {
        _id: "",
        name: "",
    },
    description: '',
    location: {
        _id: "",
        name: "",
    },
    jobType: "Full-Time",
    company: "",
    experienceLevel: undefined,
    salary: {
        currency: "$",
        min: null,
        max: null,
        frequency: "year",
    },
    requirements: {
        description: "",
        education: undefined,
        yearsOfExperience: undefined,
        certifications: [],
    },
    skills: [],           // ← was [{ _id: '', name: '', requirementLevel: undefined }]
    preScreeningQuestions: [],
    status: 'Active',
};