import { JobseekerFormData, EmployerFormData } from "../types/forms/getStartedForm.types";

export const JOBSEEKER_INITIAL_FORM_DATA: Omit<JobseekerFormData, 'user'> = {
    firstName: "",
    lastName: "",
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