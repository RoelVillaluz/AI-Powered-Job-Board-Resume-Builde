export type CreateJobFormData = {
    title: string; // Job title name (flattened for form)
    company: string; // Company ID
    location: string; // Location ID as string
    jobType: 'Full-Time' | 'Part-Time' | 'Contract' | 'Internship';
    experienceLevel?: 'Intern' | 'Entry' | 'Mid-Level' | 'Senior';
    salary: {
        currency: '$' | '₱' | '€' | '¥' | '£';
        salary: {
        min: number | null;
        max: number | null;
        };
        frequency: 'hour' | 'day' | 'week' | 'month' | 'year';
    };
    requirements: {
        description: string;
        education?: 'High School' | 'Associate' | 'Bachelor' | 'Master' | 'PhD' | 'None Required';
        yearsOfExperience?: number;
        certifications?: string[];
    };
    skills: {
        _id: string; // Skill ID
        name: string;
        requirementLevel?: 'required' | 'preferred' | 'nice-to-have';
    }[];
    preScreeningQuestions?: {
        question: string;
        required?: boolean;
        default?: Record<string, any>;
    }[];
};