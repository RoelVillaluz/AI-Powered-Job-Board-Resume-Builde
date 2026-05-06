// scripts/seedMarketData.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
import Industry from "../models/market/industryModel.js";
import Location from "../models/market/locationModel.js";
import Skill from "../models/market/skillModel.js";
import JobTitle from "../models/market/jobTitleModel.js";
import { INDUSTRY_CHOICES } from "../../../shared/constants/jobsAndIndustries/constants.js";
import type { IndustryName } from "../types/industry.types.js";
import { SeniorityLevel } from "../types/industry.types.js";
dotenv.config({ path: '.env.dev' });


type JobTitleSeed = {
    title: string;
    normalizedTitle: string;
    industry: IndustryName;
    seniorityLevel: SeniorityLevel;
}

// ============================================
// INDUSTRY SEED DATA
// ============================================

const INDUSTRY_SEED_DATA = Object.keys(INDUSTRY_CHOICES).map((name) => ({ name }));

// ============================================
// LOCATION SEED DATA
// ============================================

/**
 * baselineFactor: deviation from global median salary (e.g. +0.45 = 45% above median)
 * costOfLivingIndex: 100 = baseline (global average). NYC ~187, Manila ~38
 *
 * Sources: Numbeo COL Index, LinkedIn Salary Insights, Stack Overflow Dev Survey 2023-2024
 */
const LOCATION_SEED_DATA = [
    // United States — High COL, high baseline
    {
        name: "New York, NY",
        baselineFactor: 0.45,
        costOfLivingIndex: 187,
        demandMetrics: { totalPostings: 95000, growthRate: 4.2 },
        salaryData: { currency: '$' },
    },
    {
        name: "San Francisco, CA",
        baselineFactor: 0.60,
        costOfLivingIndex: 214,
        demandMetrics: { totalPostings: 72000, growthRate: 1.8 },
        salaryData: { currency: '$' },
    },
    {
        name: "Los Angeles, CA",
        baselineFactor: 0.35,
        costOfLivingIndex: 173,
        demandMetrics: { totalPostings: 58000, growthRate: 3.1 },
        salaryData: { currency: '$' },
    },
    // Europe
    {
        name: "London, UK",
        baselineFactor: 0.30,
        costOfLivingIndex: 168,
        demandMetrics: { totalPostings: 61000, growthRate: 3.8 },
        salaryData: { currency: '£' },
    },
    {
        name: "Paris, France",
        baselineFactor: 0.18,
        costOfLivingIndex: 152,
        demandMetrics: { totalPostings: 34000, growthRate: 2.9 },
        salaryData: { currency: '€' },
    },
    // Asia Pacific
    {
        name: "Singapore",
        baselineFactor: 0.25,
        costOfLivingIndex: 158,
        demandMetrics: { totalPostings: 28000, growthRate: 6.5 },
        salaryData: { currency: '$' },
    },
    {
        name: "Tokyo, Japan",
        baselineFactor: 0.10,
        costOfLivingIndex: 143,
        demandMetrics: { totalPostings: 22000, growthRate: 4.1 },
        salaryData: { currency: '¥' },
    },
    // Philippines — Low COL, growing tech market
    {
        name: "Manila, Philippines",
        baselineFactor: -0.62,
        costOfLivingIndex: 38,
        demandMetrics: { totalPostings: 18000, growthRate: 9.3 },
        salaryData: { currency: '₱' },
    },
    {
        name: "Cebu, Philippines",
        baselineFactor: -0.68,
        costOfLivingIndex: 32,
        demandMetrics: { totalPostings: 7200, growthRate: 11.2 },
        salaryData: { currency: '₱' },
    },
    {
        name: "Legazpi, Philippines",
        baselineFactor: -0.74,
        costOfLivingIndex: 28,
        demandMetrics: { totalPostings: 1100, growthRate: 7.8 },
        salaryData: { currency: '₱' },
    },
    // Remote — No COL anchor, salary varies widely by employer base
    {
        name: "Remote",
        baselineFactor: 0.05,
        costOfLivingIndex: 100,
        demandMetrics: { totalPostings: 210000, growthRate: 14.7 },
        salaryData: { currency: '$' },
    },
    {
        name: "Remote (US)",
        baselineFactor: 0.28,
        costOfLivingIndex: 100,
        demandMetrics: { totalPostings: 145000, growthRate: 12.3 },
        salaryData: { currency: '$' },
    },
    {
        name: "Remote (Global)",
        baselineFactor: -0.15,
        costOfLivingIndex: 100,
        demandMetrics: { totalPostings: 65000, growthRate: 18.6 },
        salaryData: { currency: '$' },
    },
];

// ============================================
// SKILL SEED DATA
// ============================================

/**
 * demandScore  (0–100): How frequently this skill appears in job postings.
 * growthRate   (-100–100): YoY change in posting frequency. Negative = declining.
 * seniorityMultiplier (0.5–3): Salary premium factor relative to a baseline role.
 *
 * Data basis: Stack Overflow Dev Survey 2024, LinkedIn Skills Insights, TIOBE index,
 * GitHub State of the Octoverse 2023, Hired State of Software Engineers 2024.
 */
const SKILL_SEED_DATA = [
    // ── Programming Languages ──────────────────────────────────────────────
    // Python: #1 in data/AI, still growing rapidly
    { name: "Python",           demandScore: 92, growthRate: 18.4,  seniorityMultiplier: 1.6  },
    // JavaScript: ubiquitous but saturated — lots of juniors, lower premium
    { name: "JavaScript",       demandScore: 95, growthRate: 2.1,   seniorityMultiplier: 1.2  },
    // TypeScript: strong growth, commands premium over plain JS
    { name: "TypeScript",       demandScore: 78, growthRate: 22.7,  seniorityMultiplier: 1.45 },
    // Java: mature, enterprise-heavy, stable demand
    { name: "Java",             demandScore: 82, growthRate: -1.8,  seniorityMultiplier: 1.35 },
    // C#: .NET ecosystem, stable Microsoft/enterprise demand
    { name: "C#",               demandScore: 68, growthRate: -0.9,  seniorityMultiplier: 1.3  },
    // C++: niche (systems, game dev, HFT) — lower postings, high salary when relevant
    { name: "C++",              demandScore: 52, growthRate: 1.2,   seniorityMultiplier: 1.55 },
    // Go: fast-growing for backend/infra/cloud
    { name: "Go",               demandScore: 58, growthRate: 19.3,  seniorityMultiplier: 1.65 },
    // Rust: trending but still early adoption stage
    { name: "Rust",             demandScore: 34, growthRate: 31.2,  seniorityMultiplier: 1.75 },
    // Ruby: declining, legacy Rails shops
    { name: "Ruby",             demandScore: 31, growthRate: -12.4, seniorityMultiplier: 1.1  },
    // PHP: declining, still large legacy WordPress/Drupal market
    { name: "PHP",              demandScore: 44, growthRate: -8.6,  seniorityMultiplier: 0.9  },
    // Swift: iOS-only so moderate demand, steady
    { name: "Swift",            demandScore: 48, growthRate: 4.7,   seniorityMultiplier: 1.4  },
    // Kotlin: growing as Java replacement on Android
    { name: "Kotlin",           demandScore: 45, growthRate: 11.8,  seniorityMultiplier: 1.4  },
    // Scala: niche data engineering / Spark use cases
    { name: "Scala",            demandScore: 28, growthRate: -4.2,  seniorityMultiplier: 1.5  },
    // R: data science academia and biostatistics only
    { name: "R",                demandScore: 35, growthRate: -3.1,  seniorityMultiplier: 1.3  },

    // ── Frontend ───────────────────────────────────────────────────────────
    // React: dominant frontend framework
    { name: "React",            demandScore: 88, growthRate: 9.4,   seniorityMultiplier: 1.4  },
    // Vue.js: strong in Asia/EU, second-tier in US
    { name: "Vue.js",           demandScore: 52, growthRate: 3.8,   seniorityMultiplier: 1.2  },
    // Angular: declining share but still large enterprise base
    { name: "Angular",          demandScore: 56, growthRate: -5.3,  seniorityMultiplier: 1.25 },
    // Next.js: fastest-growing meta-framework, increasingly required
    { name: "Next.js",          demandScore: 69, growthRate: 38.1,  seniorityMultiplier: 1.45 },
    // HTML/CSS: baseline, widely required but no premium
    { name: "HTML",             demandScore: 85, growthRate: -1.2,  seniorityMultiplier: 0.85 },
    { name: "CSS",              demandScore: 82, growthRate: -1.4,  seniorityMultiplier: 0.85 },
    // Tailwind: rapidly replacing CSS frameworks
    { name: "Tailwind CSS",     demandScore: 61, growthRate: 44.6,  seniorityMultiplier: 1.15 },

    // ── Backend ────────────────────────────────────────────────────────────
    { name: "Node.js",          demandScore: 74, growthRate: 7.2,   seniorityMultiplier: 1.3  },
    { name: "Express.js",       demandScore: 58, growthRate: -2.1,  seniorityMultiplier: 1.1  },
    // Django: Python web, growing alongside Python
    { name: "Django",           demandScore: 46, growthRate: 5.8,   seniorityMultiplier: 1.2  },
    // GraphQL: growing but not replacing REST at scale
    { name: "GraphQL",          demandScore: 49, growthRate: 12.3,  seniorityMultiplier: 1.35 },
    { name: "REST API",         demandScore: 79, growthRate: 1.6,   seniorityMultiplier: 1.15 },

    // ── Databases ──────────────────────────────────────────────────────────
    // PostgreSQL: dominant SQL choice for new projects
    { name: "PostgreSQL",       demandScore: 76, growthRate: 14.2,  seniorityMultiplier: 1.3  },
    { name: "MySQL",            demandScore: 68, growthRate: -3.4,  seniorityMultiplier: 1.1  },
    { name: "MongoDB",          demandScore: 62, growthRate: 2.7,   seniorityMultiplier: 1.2  },
    // Redis: nearly universal in production stacks
    { name: "Redis",            demandScore: 65, growthRate: 8.9,   seniorityMultiplier: 1.3  },

    // ── Cloud & DevOps ─────────────────────────────────────────────────────
    // AWS: market leader, huge salary premium
    { name: "AWS",              demandScore: 84, growthRate: 11.8,  seniorityMultiplier: 1.6  },
    { name: "Google Cloud",     demandScore: 58, growthRate: 16.4,  seniorityMultiplier: 1.55 },
    { name: "Docker",           demandScore: 77, growthRate: 10.2,  seniorityMultiplier: 1.4  },
    { name: "CI/CD",            demandScore: 71, growthRate: 13.1,  seniorityMultiplier: 1.35 },
    { name: "GitHub Actions",   demandScore: 62, growthRate: 28.4,  seniorityMultiplier: 1.25 },

    // ── AI / ML ────────────────────────────────────────────────────────────
    // Hottest category — commanding the highest premiums in 2024
    { name: "Machine Learning", demandScore: 79, growthRate: 34.6,  seniorityMultiplier: 2.0  },
    { name: "Deep Learning",    demandScore: 64, growthRate: 41.2,  seniorityMultiplier: 2.1  },
    { name: "TensorFlow",       demandScore: 52, growthRate: 8.3,   seniorityMultiplier: 1.8  },
    { name: "PyTorch",          demandScore: 57, growthRate: 46.7,  seniorityMultiplier: 1.9  },
    { name: "Natural Language Processing", demandScore: 51, growthRate: 52.3, seniorityMultiplier: 2.15 },
    { name: "Data Science",     demandScore: 73, growthRate: 22.8,  seniorityMultiplier: 1.75 },
    { name: "pandas",           demandScore: 61, growthRate: 14.3,  seniorityMultiplier: 1.5  },
    { name: "NumPy",            demandScore: 58, growthRate: 11.7,  seniorityMultiplier: 1.45 },
    { name: "scikit-learn",     demandScore: 54, growthRate: 16.9,  seniorityMultiplier: 1.6  },

    // ── Data & Analytics ───────────────────────────────────────────────────
    // SQL: foundational, high demand but low premium (oversupplied)
    { name: "SQL",              demandScore: 86, growthRate: 1.4,   seniorityMultiplier: 1.1  },

    // ── Security ───────────────────────────────────────────────────────────
    // Growing fast due to regulatory pressure and breaches
    { name: "Cybersecurity",    demandScore: 72, growthRate: 24.1,  seniorityMultiplier: 1.7  },

    // ── Mobile ─────────────────────────────────────────────────────────────
    { name: "React Native",     demandScore: 53, growthRate: 6.4,   seniorityMultiplier: 1.3  },
    // Flutter: growing but still niche
    { name: "Flutter",          demandScore: 41, growthRate: 18.7,  seniorityMultiplier: 1.3  },

    // ── Design ─────────────────────────────────────────────────────────────
    { name: "Figma",            demandScore: 64, growthRate: 21.3,  seniorityMultiplier: 1.2  },
    { name: "UI/UX Design",     demandScore: 67, growthRate: 8.9,   seniorityMultiplier: 1.25 },

    // ── Finance ────────────────────────────────────────────────────────────
    { name: "Financial Analysis", demandScore: 61, growthRate: 2.3, seniorityMultiplier: 1.4  },
    { name: "Accounting",       demandScore: 58, growthRate: -1.1,  seniorityMultiplier: 1.0  },
    { name: "Excel",            demandScore: 72, growthRate: -4.2,  seniorityMultiplier: 0.95 },

    // ── Healthcare ─────────────────────────────────────────────────────────
    { name: "Electronic Health Records", demandScore: 48, growthRate: 6.7, seniorityMultiplier: 1.2 },
    { name: "HIPAA Compliance", demandScore: 44, growthRate: 5.3,   seniorityMultiplier: 1.25 },
    { name: "Clinical Research", demandScore: 39, growthRate: 8.1,  seniorityMultiplier: 1.3  },

    // ── Soft Skills ────────────────────────────────────────────────────────
    // Listed in postings but carry minimal salary premium on their own
    { name: "Communication",    demandScore: 88, growthRate: 1.2,   seniorityMultiplier: 0.9  },
    { name: "Leadership",       demandScore: 74, growthRate: 2.8,   seniorityMultiplier: 1.15 },
    { name: "Problem Solving",  demandScore: 81, growthRate: 1.5,   seniorityMultiplier: 0.95 },
    { name: "Teamwork",         demandScore: 76, growthRate: 0.8,   seniorityMultiplier: 0.85 },
    { name: "Critical Thinking", demandScore: 68, growthRate: 3.4,  seniorityMultiplier: 0.9  },
];

// ============================================
// JOB TITLE SEED DATA
// ============================================

/**
 * demandMetrics.demandScore (0–100): posting volume relative to all titles
 * demandMetrics.monthlyGrowth: MoM % change in postings
 * demandMetrics.competitionRatio: applicants per posting (higher = more competitive for employer)
 * trendData.growthRate: YoY % change in postings
 * salaryData.medianSalary, averageSalary: USD, or local currency where noted
 * salaryData.salaryRange: realistic p25–p75 band
 *
 * Sources: LinkedIn Salary, Glassdoor, Levels.fyi, Indeed, Stack Overflow Survey 2024
 */
const JOB_TITLE_SEED_DATA: (JobTitleSeed & {
    demandMetrics?: {
        demandScore: number;
        monthlyGrowth: number;
        competitionRatio: number;
    };
    trendData?: {
        isGrowing: boolean;
        growthRate: number;
    };
    salaryData?: {
        averageSalary: number;
        medianSalary: number;
        salaryRange: { min: number; max: number; p25: number; p75: number };
        currency: string;
    };
})[] = [
    // ── Software Engineering ───────────────────────────────────────────────
    {
        title: "Software Engineer",
        normalizedTitle: "Software Engineer",
        industry: "Technology",
        seniorityLevel: "Mid-Level",
        demandMetrics: { demandScore: 88, monthlyGrowth: 2.1, competitionRatio: 4.2 },
        trendData:     { isGrowing: true, growthRate: 8.3 },
        salaryData:    { averageSalary: 135000, medianSalary: 130000, salaryRange: { min: 110000, max: 165000, p25: 120000, p75: 150000 }, currency: '$' },
    },
    {
        title: "Junior Software Engineer",
        normalizedTitle: "Software Engineer",
        industry: "Technology",
        seniorityLevel: "Entry",
        demandMetrics: { demandScore: 74, monthlyGrowth: 1.4, competitionRatio: 8.7 },
        trendData:     { isGrowing: true, growthRate: 5.1 },
        salaryData:    { averageSalary: 82000, medianSalary: 80000, salaryRange: { min: 65000, max: 100000, p25: 72000, p75: 92000 }, currency: '$' },
    },
    {
        title: "Senior Software Engineer",
        normalizedTitle: "Software Engineer",
        industry: "Technology",
        seniorityLevel: "Senior",
        demandMetrics: { demandScore: 85, monthlyGrowth: 2.8, competitionRatio: 2.9 },
        trendData:     { isGrowing: true, growthRate: 10.2 },
        salaryData:    { averageSalary: 185000, medianSalary: 178000, salaryRange: { min: 155000, max: 240000, p25: 165000, p75: 210000 }, currency: '$' },
    },
    {
        title: "Software Engineering Intern",
        normalizedTitle: "Software Engineer",
        industry: "Technology",
        seniorityLevel: "Intern",
        demandMetrics: { demandScore: 62, monthlyGrowth: 4.3, competitionRatio: 14.6 },
        trendData:     { isGrowing: true, growthRate: 6.7 },
        salaryData:    { averageSalary: 38000, medianSalary: 36000, salaryRange: { min: 26000, max: 54000, p25: 30000, p75: 48000 }, currency: '$' },
    },
    {
        title: "Frontend Engineer",
        normalizedTitle: "Frontend Engineer",
        industry: "Technology",
        seniorityLevel: "Mid-Level",
        demandMetrics: { demandScore: 80, monthlyGrowth: 1.8, competitionRatio: 5.1 },
        trendData:     { isGrowing: true, growthRate: 7.4 },
        salaryData:    { averageSalary: 128000, medianSalary: 124000, salaryRange: { min: 105000, max: 158000, p25: 115000, p75: 142000 }, currency: '$' },
    },
    {
        title: "Senior Frontend Engineer",
        normalizedTitle: "Frontend Engineer",
        industry: "Technology",
        seniorityLevel: "Senior",
        demandMetrics: { demandScore: 76, monthlyGrowth: 2.3, competitionRatio: 3.4 },
        trendData:     { isGrowing: true, growthRate: 9.1 },
        salaryData:    { averageSalary: 172000, medianSalary: 165000, salaryRange: { min: 145000, max: 215000, p25: 155000, p75: 195000 }, currency: '$' },
    },
    {
        title: "Backend Engineer",
        normalizedTitle: "Backend Engineer",
        industry: "Technology",
        seniorityLevel: "Mid-Level",
        demandMetrics: { demandScore: 82, monthlyGrowth: 2.0, competitionRatio: 4.6 },
        trendData:     { isGrowing: true, growthRate: 8.8 },
        salaryData:    { averageSalary: 138000, medianSalary: 133000, salaryRange: { min: 112000, max: 168000, p25: 122000, p75: 155000 }, currency: '$' },
    },
    {
        title: "Senior Backend Engineer",
        normalizedTitle: "Backend Engineer",
        industry: "Technology",
        seniorityLevel: "Senior",
        demandMetrics: { demandScore: 79, monthlyGrowth: 2.6, competitionRatio: 3.1 },
        trendData:     { isGrowing: true, growthRate: 11.4 },
        salaryData:    { averageSalary: 192000, medianSalary: 185000, salaryRange: { min: 160000, max: 248000, p25: 172000, p75: 220000 }, currency: '$' },
    },
    {
        title: "Full Stack Engineer",
        normalizedTitle: "Full Stack Engineer",
        industry: "Technology",
        seniorityLevel: "Mid-Level",
        demandMetrics: { demandScore: 84, monthlyGrowth: 1.9, competitionRatio: 5.8 },
        trendData:     { isGrowing: true, growthRate: 6.9 },
        salaryData:    { averageSalary: 132000, medianSalary: 127000, salaryRange: { min: 108000, max: 162000, p25: 118000, p75: 148000 }, currency: '$' },
    },
    {
        title: "Senior Full Stack Engineer",
        normalizedTitle: "Full Stack Engineer",
        industry: "Technology",
        seniorityLevel: "Senior",
        demandMetrics: { demandScore: 77, monthlyGrowth: 2.4, competitionRatio: 3.8 },
        trendData:     { isGrowing: true, growthRate: 9.7 },
        salaryData:    { averageSalary: 178000, medianSalary: 172000, salaryRange: { min: 150000, max: 228000, p25: 160000, p75: 205000 }, currency: '$' },
    },

    // ── Data ───────────────────────────────────────────────────────────────
    {
        title: "Data Scientist",
        normalizedTitle: "Data Scientist",
        industry: "Technology",
        seniorityLevel: "Mid-Level",
        demandMetrics: { demandScore: 78, monthlyGrowth: 3.4, competitionRatio: 3.7 },
        trendData:     { isGrowing: true, growthRate: 16.2 },
        salaryData:    { averageSalary: 148000, medianSalary: 142000, salaryRange: { min: 118000, max: 185000, p25: 130000, p75: 168000 }, currency: '$' },
    },
    {
        title: "Senior Data Scientist",
        normalizedTitle: "Data Scientist",
        industry: "Technology",
        seniorityLevel: "Senior",
        demandMetrics: { demandScore: 72, monthlyGrowth: 3.9, competitionRatio: 2.6 },
        trendData:     { isGrowing: true, growthRate: 19.8 },
        salaryData:    { averageSalary: 208000, medianSalary: 198000, salaryRange: { min: 172000, max: 275000, p25: 185000, p75: 240000 }, currency: '$' },
    },
    {
        title: "Data Engineer",
        normalizedTitle: "Data Engineer",
        industry: "Technology",
        seniorityLevel: "Mid-Level",
        demandMetrics: { demandScore: 75, monthlyGrowth: 4.1, competitionRatio: 3.2 },
        trendData:     { isGrowing: true, growthRate: 22.4 },
        salaryData:    { averageSalary: 152000, medianSalary: 146000, salaryRange: { min: 122000, max: 190000, p25: 134000, p75: 172000 }, currency: '$' },
    },
    {
        title: "Senior Data Engineer",
        normalizedTitle: "Data Engineer",
        industry: "Technology",
        seniorityLevel: "Senior",
        demandMetrics: { demandScore: 68, monthlyGrowth: 4.6, competitionRatio: 2.3 },
        trendData:     { isGrowing: true, growthRate: 26.1 },
        salaryData:    { averageSalary: 212000, medianSalary: 202000, salaryRange: { min: 175000, max: 280000, p25: 188000, p75: 248000 }, currency: '$' },
    },
    {
        title: "Data Analyst",
        normalizedTitle: "Data Analyst",
        industry: "Technology",
        seniorityLevel: "Entry",
        demandMetrics: { demandScore: 71, monthlyGrowth: 1.6, competitionRatio: 9.4 },
        trendData:     { isGrowing: true, growthRate: 7.3 },
        salaryData:    { averageSalary: 72000, medianSalary: 68000, salaryRange: { min: 52000, max: 92000, p25: 60000, p75: 82000 }, currency: '$' },
    },
    {
        title: "Senior Data Analyst",
        normalizedTitle: "Data Analyst",
        industry: "Technology",
        seniorityLevel: "Mid-Level",
        demandMetrics: { demandScore: 66, monthlyGrowth: 2.1, competitionRatio: 5.7 },
        trendData:     { isGrowing: true, growthRate: 9.8 },
        salaryData:    { averageSalary: 108000, medianSalary: 103000, salaryRange: { min: 85000, max: 135000, p25: 94000, p75: 120000 }, currency: '$' },
    },
    {
        title: "Machine Learning Engineer",
        normalizedTitle: "Machine Learning Engineer",
        industry: "Technology",
        seniorityLevel: "Mid-Level",
        // Hottest role in 2024 — high demand, low supply
        demandMetrics: { demandScore: 73, monthlyGrowth: 7.8, competitionRatio: 2.1 },
        trendData:     { isGrowing: true, growthRate: 41.6 },
        salaryData:    { averageSalary: 182000, medianSalary: 175000, salaryRange: { min: 148000, max: 238000, p25: 162000, p75: 215000 }, currency: '$' },
    },
    {
        title: "Senior Machine Learning Engineer",
        normalizedTitle: "Machine Learning Engineer",
        industry: "Technology",
        seniorityLevel: "Senior",
        demandMetrics: { demandScore: 69, monthlyGrowth: 9.2, competitionRatio: 1.6 },
        trendData:     { isGrowing: true, growthRate: 52.3 },
        salaryData:    { averageSalary: 258000, medianSalary: 245000, salaryRange: { min: 210000, max: 380000, p25: 228000, p75: 310000 }, currency: '$' },
    },

    // ── DevOps & Cloud ─────────────────────────────────────────────────────
    {
        title: "DevOps Engineer",
        normalizedTitle: "DevOps Engineer",
        industry: "Technology",
        seniorityLevel: "Mid-Level",
        demandMetrics: { demandScore: 77, monthlyGrowth: 2.9, competitionRatio: 3.5 },
        trendData:     { isGrowing: true, growthRate: 14.7 },
        salaryData:    { averageSalary: 145000, medianSalary: 138000, salaryRange: { min: 115000, max: 180000, p25: 126000, p75: 162000 }, currency: '$' },
    },
    {
        title: "Senior DevOps Engineer",
        normalizedTitle: "DevOps Engineer",
        industry: "Technology",
        seniorityLevel: "Senior",
        demandMetrics: { demandScore: 71, monthlyGrowth: 3.4, competitionRatio: 2.4 },
        trendData:     { isGrowing: true, growthRate: 17.9 },
        salaryData:    { averageSalary: 198000, medianSalary: 188000, salaryRange: { min: 162000, max: 258000, p25: 175000, p75: 228000 }, currency: '$' },
    },
    {
        title: "Cloud Engineer",
        normalizedTitle: "Cloud Engineer",
        industry: "Technology",
        seniorityLevel: "Mid-Level",
        demandMetrics: { demandScore: 74, monthlyGrowth: 3.7, competitionRatio: 3.0 },
        trendData:     { isGrowing: true, growthRate: 19.3 },
        salaryData:    { averageSalary: 152000, medianSalary: 145000, salaryRange: { min: 120000, max: 190000, p25: 132000, p75: 170000 }, currency: '$' },
    },

    // ── Design ─────────────────────────────────────────────────────────────
    {
        title: "UX Designer",
        normalizedTitle: "UX Designer",
        industry: "Technology",
        seniorityLevel: "Mid-Level",
        demandMetrics: { demandScore: 64, monthlyGrowth: 0.8, competitionRatio: 7.2 },
        trendData:     { isGrowing: false, growthRate: -2.1 },
        salaryData:    { averageSalary: 112000, medianSalary: 106000, salaryRange: { min: 85000, max: 142000, p25: 95000, p75: 128000 }, currency: '$' },
    },

    // ── Product ────────────────────────────────────────────────────────────
    {
        title: "Product Manager",
        normalizedTitle: "Product Manager",
        industry: "Technology",
        seniorityLevel: "Mid-Level",
        demandMetrics: { demandScore: 70, monthlyGrowth: 1.2, competitionRatio: 6.8 },
        trendData:     { isGrowing: true, growthRate: 5.4 },
        salaryData:    { averageSalary: 155000, medianSalary: 148000, salaryRange: { min: 120000, max: 198000, p25: 135000, p75: 178000 }, currency: '$' },
    },
    {
        title: "Senior Product Manager",
        normalizedTitle: "Product Manager",
        industry: "Technology",
        seniorityLevel: "Senior",
        demandMetrics: { demandScore: 65, monthlyGrowth: 1.6, competitionRatio: 4.9 },
        trendData:     { isGrowing: true, growthRate: 7.8 },
        salaryData:    { averageSalary: 218000, medianSalary: 205000, salaryRange: { min: 172000, max: 290000, p25: 188000, p75: 255000 }, currency: '$' },
    },

    // ── Finance ────────────────────────────────────────────────────────────
    {
        title: "Financial Analyst",
        normalizedTitle: "Financial Analyst",
        industry: "Finance",
        seniorityLevel: "Entry",
        demandMetrics: { demandScore: 67, monthlyGrowth: 0.9, competitionRatio: 7.8 },
        trendData:     { isGrowing: true, growthRate: 3.2 },
        salaryData:    { averageSalary: 68000, medianSalary: 65000, salaryRange: { min: 52000, max: 86000, p25: 58000, p75: 76000 }, currency: '$' },
    },
    {
        title: "Investment Banker",
        normalizedTitle: "Investment Banker",
        industry: "Finance",
        seniorityLevel: "Mid-Level",
        demandMetrics: { demandScore: 48, monthlyGrowth: 0.4, competitionRatio: 11.2 },
        trendData:     { isGrowing: false, growthRate: 1.1 },
        salaryData:    { averageSalary: 175000, medianSalary: 158000, salaryRange: { min: 120000, max: 280000, p25: 138000, p75: 225000 }, currency: '$' },
    },
    {
        title: "Accountant",
        normalizedTitle: "Accountant",
        industry: "Finance",
        seniorityLevel: "Entry",
        demandMetrics: { demandScore: 63, monthlyGrowth: 0.6, competitionRatio: 6.4 },
        trendData:     { isGrowing: false, growthRate: -0.8 },
        salaryData:    { averageSalary: 58000, medianSalary: 55000, salaryRange: { min: 42000, max: 74000, p25: 48000, p75: 66000 }, currency: '$' },
    },

    // ── Healthcare ─────────────────────────────────────────────────────────
    {
        title: "Registered Nurse",
        normalizedTitle: "Registered Nurse",
        industry: "Healthcare",
        seniorityLevel: "Mid-Level",
        demandMetrics: { demandScore: 81, monthlyGrowth: 2.4, competitionRatio: 1.8 },
        trendData:     { isGrowing: true, growthRate: 12.6 },
        salaryData:    { averageSalary: 82000, medianSalary: 78000, salaryRange: { min: 62000, max: 108000, p25: 70000, p75: 96000 }, currency: '$' },
    },
    {
        title: "Physician",
        normalizedTitle: "Physician",
        industry: "Healthcare",
        seniorityLevel: "Senior",
        demandMetrics: { demandScore: 76, monthlyGrowth: 1.8, competitionRatio: 1.2 },
        trendData:     { isGrowing: true, growthRate: 8.4 },
        salaryData:    { averageSalary: 248000, medianSalary: 235000, salaryRange: { min: 180000, max: 380000, p25: 205000, p75: 310000 }, currency: '$' },
    },

    // ── Education ──────────────────────────────────────────────────────────
    {
        title: "Teacher",
        normalizedTitle: "Teacher",
        industry: "Education",
        seniorityLevel: "Mid-Level",
        demandMetrics: { demandScore: 74, monthlyGrowth: 1.1, competitionRatio: 4.3 },
        trendData:     { isGrowing: true, growthRate: 4.7 },
        salaryData:    { averageSalary: 58000, medianSalary: 55000, salaryRange: { min: 38000, max: 78000, p25: 46000, p75: 68000 }, currency: '$' },
    },

    // ── Marketing ──────────────────────────────────────────────────────────
    {
        title: "Marketing Manager",
        normalizedTitle: "Marketing Manager",
        industry: "Professional Services",
        seniorityLevel: "Mid-Level",
        demandMetrics: { demandScore: 66, monthlyGrowth: 1.3, competitionRatio: 6.1 },
        trendData:     { isGrowing: true, growthRate: 4.9 },
        salaryData:    { averageSalary: 98000, medianSalary: 93000, salaryRange: { min: 72000, max: 130000, p25: 82000, p75: 115000 }, currency: '$' },
    },
    {
        title: "Digital Marketing Specialist",
        normalizedTitle: "Digital Marketing Specialist",
        industry: "Professional Services",
        seniorityLevel: "Entry",
        demandMetrics: { demandScore: 61, monthlyGrowth: 1.8, competitionRatio: 8.4 },
        trendData:     { isGrowing: true, growthRate: 9.2 },
        salaryData:    { averageSalary: 58000, medianSalary: 54000, salaryRange: { min: 40000, max: 76000, p25: 47000, p75: 67000 }, currency: '$' },
    },
];

// ============================================
// UPSERT HELPERS
// ============================================

/**
 * Builds a $set payload from an object, flattening nested keys with dot notation.
 * This is used so we only set the fields present in seed data without clobbering
 * computed fields (embeddings, salary aggregates, etc.) that aren't in the seed.
 */
function flattenForSet(obj: Record<string, any>, prefix = ''): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
            Object.assign(result, flattenForSet(v, key));
        } else {
            result[key] = v;
        }
    }
    return result;
}

// ============================================
// SEEDING FUNCTIONS
// ============================================

const seedIndustries = async () => {
    if (!INDUSTRY_SEED_DATA.length) return;

    const ops = INDUSTRY_SEED_DATA.map(({ name }) => ({
        updateOne: {
            filter: { name },
            // Cast needed: Mongoose's UpdateFilter<T> doesn't allow null for Date fields,
            // but MongoDB accepts it at runtime and $setOnInsert only fires on insert.
            update: {
                $setOnInsert: { name },
            } as any,
            upsert: true,
        },
    }));

    const result = await Industry.bulkWrite(ops, { ordered: false });
    console.log(`Industries — upserted: ${result.upsertedCount}, matched (no-op): ${result.matchedCount}`);
};

const seedLocations = async () => {
    if (!LOCATION_SEED_DATA.length) return;

    const ops = LOCATION_SEED_DATA.map(({ name, baselineFactor, costOfLivingIndex, demandMetrics, salaryData }) => {
        // These are seed-defined fields we always want kept current
        const seedFields = flattenForSet({ baselineFactor, costOfLivingIndex, demandMetrics, salaryData });

        return {
            updateOne: {
                filter: { name },
                // Cast needed: UpdateFilter<T> rejects null for Date fields, but
                // $setOnInsert only fires on insert and MongoDB handles null fine.
                update: {
                    $set: seedFields,
                    $setOnInsert: {
                        name,
                        embedding: null,
                        embeddingGeneratedAt: null,
                    },
                } as any,
                upsert: true,
            },
        };
    });

    const result = await Location.bulkWrite(ops, { ordered: false });
    console.log(`Locations — upserted: ${result.upsertedCount}, updated: ${result.modifiedCount}, matched (no-op): ${result.matchedCount - result.modifiedCount}`);
};

const seedSkills = async () => {
    if (!SKILL_SEED_DATA.length) return;

    const ops = SKILL_SEED_DATA.map(({ name, demandScore, growthRate, seniorityMultiplier }) => ({
        updateOne: {
            filter: { name },
            // Cast needed: UpdateFilter<T> rejects null for Date fields in $setOnInsert,
            // but MongoDB handles this correctly at runtime.
            update: {
                $set: { demandScore, growthRate, seniorityMultiplier },
                $setOnInsert: {
                    name,
                    embedding: null,
                    embeddingGeneratedAt: null,
                },
            } as any,
            upsert: true,
        },
    }));

    const result = await Skill.bulkWrite(ops, { ordered: false });
    console.log(`Skills — upserted: ${result.upsertedCount}, updated: ${result.modifiedCount}, matched (no-op): ${result.matchedCount - result.modifiedCount}`);
};

const seedJobTitles = async () => {
    if (!JOB_TITLE_SEED_DATA.length) return;

    const ops = JOB_TITLE_SEED_DATA.map(({
        title,
        normalizedTitle,
        industry,
        seniorityLevel,
        demandMetrics,
        trendData,
        salaryData,
    }) => {
        const setFields: Record<string, any> = {
            normalizedTitle,
            industry,
            seniorityLevel,
        };

        // Only include demandMetrics/trendData/salaryData if defined in seed
        if (demandMetrics)  Object.assign(setFields, flattenForSet({ demandMetrics }));
        if (trendData)      Object.assign(setFields, flattenForSet({ trendData }));
        if (salaryData)     Object.assign(setFields, flattenForSet({ salaryData }));

        return {
            updateOne: {
                filter: { title },
                // Cast needed: UpdateFilter<T> rejects null for Date fields in $setOnInsert,
                // but MongoDB handles this correctly at runtime.
                update: {
                    $set: setFields,
                    $setOnInsert: {
                        title,
                        embedding: null,
                        embeddingGeneratedAt: null,
                        isActive: true,
                    },
                } as any,
                upsert: true,
            },
        };
    });

    const result = await JobTitle.bulkWrite(ops, { ordered: false });
    console.log(`Job Titles — upserted: ${result.upsertedCount}, updated: ${result.modifiedCount}, matched (no-op): ${result.matchedCount - result.modifiedCount}`);
};

// ============================================
// MAIN
// ============================================

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log("Connected to MongoDB");

        console.log("\nSeeding market data...\n");

        await seedIndustries();
        await seedSkills();
        await seedJobTitles();
        await seedLocations();

        console.log("\nSeeding complete.");
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
};

seed();