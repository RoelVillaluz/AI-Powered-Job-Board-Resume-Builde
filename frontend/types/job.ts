export interface JobDetailsParams { jobId: String }

export interface Salary {
    currency: '$' | '₱' | '€' | '¥' | '£';
    amount: number | null;
    frequency: 'hour' | 'day' | 'week' | 'month' | 'year';
}
  
export interface Skill {
    name: string;
}
  
export interface PreScreeningQuestion {
    question: string;
    required?: boolean;
}

export interface Company {
    _id: string;
    name: string;
    logo?: string;
    description?: string;
    industry?: string;
}
  
export interface Job {
    _id: string;
    title: string;
    company: string; // or you can type as `Company['_id']` if you import Company interface
    location: string;
    jobType: 'Full-Time' | 'Part-Time' | 'Contract' | 'Internship';
    experienceLevel?: 'Intern' | 'Entry' | 'Mid-Level' | 'Senior';
    salary?: Salary;
    requirements: string[];
    skills: Skill[];
    preScreeningQuestions?: PreScreeningQuestion[];
    applicants?: string[]; // array of User _id
    postedAt: string; // Date in ISO string
}
