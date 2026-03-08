import { IndustryName } from "../../../backend/types/industry.types";

// constants.ts
export const INDUSTRY_CHOICES = {
    'Technology': 'Technology',
    'Finance': 'Finance',
    'Healthcare': 'Healthcare',
    'Manufacturing': 'Manufacturing',
    'Retail': 'Retail',
    'Education': 'Education',
    'Government': 'Government',
    'Non-Profit': 'Non-Profit',
    'Entertainment': 'Entertainment',
    'Real Estate': 'Real Estate',
    'Energy': 'Energy',
    'Transportation': 'Transportation',
    'Professional Services': 'Professional Services',
    'Other': 'Other'
} as const;


export const INDUSTRY_NAMES = Object.keys(INDUSTRY_CHOICES) as IndustryName[];

// Seniority levels
export const SENIORITY_LEVELS = ['Intern', 'Entry', 'Mid-Level', 'Senior'] as const;

// Competition levels
export const COMPETITION_LEVELS = ['Very Low', 'Low', 'Medium', 'High', 'Very High'] as const;

// Skill importance
export const SKILL_IMPORTANCE_LEVELS = ['required', 'preferred', 'nice-to-have'] as const;

// Degree types
export const DEGREE_TYPES = ['High School', 'Associate', 'Bachelor', 'Master', 'PhD', 'None Required'] as const;

// Currencies
export const CURRENCIES = ['$', '₱', '€', '¥', '£'] as const;
export type Currency = typeof CURRENCIES[number];

// Job types
export const JOB_TYPES = ['Full-Time', 'Part-Time', 'Contract', 'Internship'] as const;

// Job status
export const JOB_STATUS = ['Active', 'Closed', 'Archived'] as const;
