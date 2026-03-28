export type FormJobTitle = {
    _id?: string;
    name: string;
}

export type FormLocation = {
    _id?: string;
    name: string;
}

export type FormSkill = {
    _id?: string; // Skill ID
    name: string;
    requirementLevel?: 'required' | 'preferred' | 'nice-to-have' | undefined;
}

export type CreateJobFormData = {
    title: FormJobTitle;
    company: string; // Company ID
    location: FormLocation
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
    skills: FormSkill[];
    preScreeningQuestions?: {
        question: string;
        required?: boolean;
        default?: Record<string, any>;
    }[];
};