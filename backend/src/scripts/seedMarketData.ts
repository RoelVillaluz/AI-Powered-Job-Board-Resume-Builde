// src/scripts/seedMarketData.ts
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

// ============================================
// TYPES
// ============================================

type TopSkillSeed = {
    skillName: string;
    frequency: number;
    importance: 'Required' | 'Preferred' | 'Nice-to-Have';
};

type JobTitleSeed = {
    title: string;
    normalizedTitle: string;
    industry: IndustryName;
    seniorityLevel: SeniorityLevel;
    topSkills?: TopSkillSeed[];
};

type SkillSeed = {
    name: string;
    demandScore: number;
    growthRate: number;
    seniorityMultiplier: number;
    // Salary: average salary of roles that list this skill (USD).
    // Higher-premium skills (ML, Rust, Go) pull the average up significantly.
    // Soft skills show lower salary averages because they appear across all levels.
    salaryData: {
        averageSalary: number;
        medianSalary: number;
        salaryRange: { min: number; max: number; p25: number; p75: number };
        currency: '$';
    };
    // Names of similar skills — resolved to ObjectIds in the post-seed enrichment pass.
    similarSkillNames: string[];
};

// ============================================
// INDUSTRY SEED DATA
// ============================================

const INDUSTRY_SEED_DATA = Object.keys(INDUSTRY_CHOICES).map((name) => ({ name }));

// ============================================
// LOCATION SEED DATA
// ============================================

/**
 * baselineFactor: deviation from global median salary (+0.45 = 45% above median)
 * costOfLivingIndex: 100 = baseline (global average). NYC ~187, Manila ~38
 * salaryData: tech-role median salary for this market, in local currency.
 *
 * Sources: Numbeo COL Index, LinkedIn Salary Insights, Stack Overflow Dev Survey 2023-2024,
 * Glassdoor Location Salary Reports 2024.
 */
const LOCATION_SEED_DATA = [
    {
        name: "New York, NY",
        baselineFactor: 0.45,
        costOfLivingIndex: 187,
        demandMetrics: { totalPostings: 95000, growthRate: 4.2 },
        salaryData: { averageSalary: 155000, medianSalary: 145000, salaryRange: { min: 85000, max: 280000, p25: 115000, p75: 195000 }, currency: '$' },
    },
    {
        name: "San Francisco, CA",
        baselineFactor: 0.60,
        costOfLivingIndex: 214,
        demandMetrics: { totalPostings: 72000, growthRate: 1.8 },
        salaryData: { averageSalary: 178000, medianSalary: 168000, salaryRange: { min: 95000, max: 380000, p25: 138000, p75: 235000 }, currency: '$' },
    },
    {
        name: "Los Angeles, CA",
        baselineFactor: 0.35,
        costOfLivingIndex: 173,
        demandMetrics: { totalPostings: 58000, growthRate: 3.1 },
        salaryData: { averageSalary: 142000, medianSalary: 133000, salaryRange: { min: 78000, max: 255000, p25: 105000, p75: 178000 }, currency: '$' },
    },
    {
        name: "London, UK",
        baselineFactor: 0.30,
        costOfLivingIndex: 168,
        demandMetrics: { totalPostings: 61000, growthRate: 3.8 },
        salaryData: { averageSalary: 82000, medianSalary: 75000, salaryRange: { min: 42000, max: 165000, p25: 58000, p75: 108000 }, currency: '£' },
    },
    {
        name: "Paris, France",
        baselineFactor: 0.18,
        costOfLivingIndex: 152,
        demandMetrics: { totalPostings: 34000, growthRate: 2.9 },
        salaryData: { averageSalary: 62000, medianSalary: 56000, salaryRange: { min: 35000, max: 125000, p25: 44000, p75: 82000 }, currency: '€' },
    },
    {
        name: "Singapore",
        baselineFactor: 0.25,
        costOfLivingIndex: 158,
        demandMetrics: { totalPostings: 28000, growthRate: 6.5 },
        salaryData: { averageSalary: 88000, medianSalary: 80000, salaryRange: { min: 45000, max: 175000, p25: 62000, p75: 118000 }, currency: '$' },
    },
    {
        name: "Tokyo, Japan",
        baselineFactor: 0.10,
        costOfLivingIndex: 143,
        demandMetrics: { totalPostings: 22000, growthRate: 4.1 },
        // Yen amounts — tech engineer median ~6.2M JPY/yr
        salaryData: { averageSalary: 6800000, medianSalary: 6200000, salaryRange: { min: 3800000, max: 14000000, p25: 5000000, p75: 9200000 }, currency: '¥' },
    },
    {
        name: "Manila, Philippines",
        baselineFactor: -0.62,
        costOfLivingIndex: 38,
        demandMetrics: { totalPostings: 18000, growthRate: 9.3 },
        // PHP amounts — mid-level dev median ~580k PHP/yr
        salaryData: { averageSalary: 680000, medianSalary: 580000, salaryRange: { min: 240000, max: 1800000, p25: 420000, p75: 960000 }, currency: '₱' },
    },
    {
        name: "Cebu, Philippines",
        baselineFactor: -0.68,
        costOfLivingIndex: 32,
        demandMetrics: { totalPostings: 7200, growthRate: 11.2 },
        salaryData: { averageSalary: 540000, medianSalary: 460000, salaryRange: { min: 200000, max: 1400000, p25: 340000, p75: 760000 }, currency: '₱' },
    },
    {
        name: "Legazpi, Philippines",
        baselineFactor: -0.74,
        costOfLivingIndex: 28,
        demandMetrics: { totalPostings: 1100, growthRate: 7.8 },
        salaryData: { averageSalary: 420000, medianSalary: 360000, salaryRange: { min: 180000, max: 1100000, p25: 270000, p75: 600000 }, currency: '₱' },
    },
    {
        name: "Remote",
        baselineFactor: 0.05,
        costOfLivingIndex: 100,
        demandMetrics: { totalPostings: 210000, growthRate: 14.7 },
        salaryData: { averageSalary: 128000, medianSalary: 118000, salaryRange: { min: 55000, max: 280000, p25: 88000, p75: 168000 }, currency: '$' },
    },
    {
        name: "Remote (US)",
        baselineFactor: 0.28,
        costOfLivingIndex: 100,
        demandMetrics: { totalPostings: 145000, growthRate: 12.3 },
        salaryData: { averageSalary: 148000, medianSalary: 138000, salaryRange: { min: 80000, max: 310000, p25: 110000, p75: 195000 }, currency: '$' },
    },
    {
        name: "Remote (Global)",
        baselineFactor: -0.15,
        costOfLivingIndex: 100,
        demandMetrics: { totalPostings: 65000, growthRate: 18.6 },
        salaryData: { averageSalary: 72000, medianSalary: 62000, salaryRange: { min: 28000, max: 180000, p25: 42000, p75: 98000 }, currency: '$' },
    },
];

// ============================================
// SKILL SEED DATA
// ============================================

/**
 * demandScore  (0–100): Posting frequency globally.
 * growthRate   (-100–100): YoY change. Negative = declining.
 * seniorityMultiplier (0.5–3): Salary premium factor vs. a baseline role.
 * salaryData.averageSalary: average salary of roles that list this skill (USD).
 * similarSkillNames: resolved to ObjectIds + scores in the enrichment pass.
 *
 * Sources: Stack Overflow Dev Survey 2024, LinkedIn Skills Insights, TIOBE,
 * GitHub Octoverse 2023, Hired State of Software Engineers 2024, Levels.fyi.
 */
const SKILL_SEED_DATA: SkillSeed[] = [
    // ── Programming Languages ──────────────────────────────────────────────
    {
        name: "Python",
        demandScore: 92, growthRate: 18.4, seniorityMultiplier: 1.6,
        salaryData: { averageSalary: 148000, medianSalary: 140000, salaryRange: { min: 88000, max: 265000, p25: 118000, p75: 185000 }, currency: '$' },
        similarSkillNames: ["R", "pandas", "NumPy", "scikit-learn", "Django", "Data Science"],
    },
    {
        name: "JavaScript",
        demandScore: 95, growthRate: 2.1, seniorityMultiplier: 1.2,
        salaryData: { averageSalary: 118000, medianSalary: 112000, salaryRange: { min: 62000, max: 210000, p25: 88000, p75: 148000 }, currency: '$' },
        similarSkillNames: ["TypeScript", "Node.js", "React", "Vue.js", "Angular", "Next.js"],
    },
    {
        name: "TypeScript",
        demandScore: 78, growthRate: 22.7, seniorityMultiplier: 1.45,
        salaryData: { averageSalary: 138000, medianSalary: 130000, salaryRange: { min: 82000, max: 240000, p25: 108000, p75: 172000 }, currency: '$' },
        similarSkillNames: ["JavaScript", "React", "Next.js", "Node.js", "Angular"],
    },
    {
        name: "Java",
        demandScore: 82, growthRate: -1.8, seniorityMultiplier: 1.35,
        salaryData: { averageSalary: 128000, medianSalary: 122000, salaryRange: { min: 72000, max: 225000, p25: 98000, p75: 162000 }, currency: '$' },
        similarSkillNames: ["Kotlin", "Scala", "C#"],
    },
    {
        name: "C#",
        demandScore: 68, growthRate: -0.9, seniorityMultiplier: 1.3,
        salaryData: { averageSalary: 122000, medianSalary: 116000, salaryRange: { min: 68000, max: 215000, p25: 92000, p75: 155000 }, currency: '$' },
        similarSkillNames: ["Java", "Kotlin"],
    },
    {
        name: "C++",
        demandScore: 52, growthRate: 1.2, seniorityMultiplier: 1.55,
        salaryData: { averageSalary: 145000, medianSalary: 138000, salaryRange: { min: 82000, max: 260000, p25: 112000, p75: 188000 }, currency: '$' },
        similarSkillNames: ["C#", "Rust", "Go", "Java"],
    },
    {
        name: "Go",
        demandScore: 58, growthRate: 19.3, seniorityMultiplier: 1.65,
        salaryData: { averageSalary: 158000, medianSalary: 150000, salaryRange: { min: 92000, max: 275000, p25: 125000, p75: 198000 }, currency: '$' },
        similarSkillNames: ["Rust", "Python", "C++", "Node.js", "Docker"],
    },
    {
        name: "Rust",
        demandScore: 34, growthRate: 31.2, seniorityMultiplier: 1.75,
        salaryData: { averageSalary: 168000, medianSalary: 160000, salaryRange: { min: 98000, max: 295000, p25: 132000, p75: 215000 }, currency: '$' },
        similarSkillNames: ["Go", "C++", "Python"],
    },
    {
        name: "Ruby",
        demandScore: 31, growthRate: -12.4, seniorityMultiplier: 1.1,
        salaryData: { averageSalary: 112000, medianSalary: 106000, salaryRange: { min: 62000, max: 188000, p25: 84000, p75: 142000 }, currency: '$' },
        similarSkillNames: ["Python", "PHP", "Node.js"],
    },
    {
        name: "PHP",
        demandScore: 44, growthRate: -8.6, seniorityMultiplier: 0.9,
        salaryData: { averageSalary: 95000, medianSalary: 88000, salaryRange: { min: 48000, max: 162000, p25: 68000, p75: 118000 }, currency: '$' },
        similarSkillNames: ["Ruby", "Python", "JavaScript", "MySQL"],
    },
    {
        name: "Swift",
        demandScore: 48, growthRate: 4.7, seniorityMultiplier: 1.4,
        salaryData: { averageSalary: 138000, medianSalary: 130000, salaryRange: { min: 78000, max: 245000, p25: 105000, p75: 178000 }, currency: '$' },
        similarSkillNames: ["Kotlin", "React Native", "Flutter"],
    },
    {
        name: "Kotlin",
        demandScore: 45, growthRate: 11.8, seniorityMultiplier: 1.4,
        salaryData: { averageSalary: 135000, medianSalary: 128000, salaryRange: { min: 76000, max: 238000, p25: 102000, p75: 172000 }, currency: '$' },
        similarSkillNames: ["Java", "Swift", "Flutter"],
    },
    {
        name: "Scala",
        demandScore: 28, growthRate: -4.2, seniorityMultiplier: 1.5,
        salaryData: { averageSalary: 148000, medianSalary: 140000, salaryRange: { min: 88000, max: 255000, p25: 115000, p75: 188000 }, currency: '$' },
        similarSkillNames: ["Java", "Python"],
    },
    {
        name: "R",
        demandScore: 35, growthRate: -3.1, seniorityMultiplier: 1.3,
        salaryData: { averageSalary: 122000, medianSalary: 115000, salaryRange: { min: 68000, max: 212000, p25: 92000, p75: 158000 }, currency: '$' },
        similarSkillNames: ["Python", "pandas", "NumPy", "Data Science", "scikit-learn"],
    },

    // ── Frontend ───────────────────────────────────────────────────────────
    {
        name: "React",
        demandScore: 88, growthRate: 9.4, seniorityMultiplier: 1.4,
        salaryData: { averageSalary: 132000, medianSalary: 125000, salaryRange: { min: 78000, max: 228000, p25: 102000, p75: 165000 }, currency: '$' },
        similarSkillNames: ["Next.js", "Vue.js", "Angular", "TypeScript", "JavaScript", "React Native"],
    },
    {
        name: "Vue.js",
        demandScore: 52, growthRate: 3.8, seniorityMultiplier: 1.2,
        salaryData: { averageSalary: 118000, medianSalary: 112000, salaryRange: { min: 65000, max: 198000, p25: 88000, p75: 148000 }, currency: '$' },
        similarSkillNames: ["React", "Angular", "JavaScript"],
    },
    {
        name: "Angular",
        demandScore: 56, growthRate: -5.3, seniorityMultiplier: 1.25,
        salaryData: { averageSalary: 122000, medianSalary: 116000, salaryRange: { min: 68000, max: 208000, p25: 92000, p75: 155000 }, currency: '$' },
        similarSkillNames: ["React", "Vue.js", "TypeScript", "JavaScript"],
    },
    {
        name: "Next.js",
        demandScore: 69, growthRate: 38.1, seniorityMultiplier: 1.45,
        salaryData: { averageSalary: 138000, medianSalary: 130000, salaryRange: { min: 82000, max: 235000, p25: 108000, p75: 172000 }, currency: '$' },
        similarSkillNames: ["React", "TypeScript", "Node.js", "Tailwind CSS"],
    },
    {
        name: "HTML",
        demandScore: 85, growthRate: -1.2, seniorityMultiplier: 0.85,
        salaryData: { averageSalary: 92000, medianSalary: 85000, salaryRange: { min: 42000, max: 158000, p25: 62000, p75: 118000 }, currency: '$' },
        similarSkillNames: ["CSS", "JavaScript", "Tailwind CSS"],
    },
    {
        name: "CSS",
        demandScore: 82, growthRate: -1.4, seniorityMultiplier: 0.85,
        salaryData: { averageSalary: 92000, medianSalary: 85000, salaryRange: { min: 42000, max: 158000, p25: 62000, p75: 118000 }, currency: '$' },
        similarSkillNames: ["HTML", "Tailwind CSS", "JavaScript", "Figma"],
    },
    {
        name: "Tailwind CSS",
        demandScore: 61, growthRate: 44.6, seniorityMultiplier: 1.15,
        salaryData: { averageSalary: 115000, medianSalary: 108000, salaryRange: { min: 62000, max: 195000, p25: 84000, p75: 148000 }, currency: '$' },
        similarSkillNames: ["CSS", "HTML", "React", "Next.js"],
    },

    // ── Backend ────────────────────────────────────────────────────────────
    {
        name: "Node.js",
        demandScore: 74, growthRate: 7.2, seniorityMultiplier: 1.3,
        salaryData: { averageSalary: 128000, medianSalary: 122000, salaryRange: { min: 72000, max: 218000, p25: 98000, p75: 162000 }, currency: '$' },
        similarSkillNames: ["JavaScript", "TypeScript", "Express.js", "Next.js", "Go"],
    },
    {
        name: "Express.js",
        demandScore: 58, growthRate: -2.1, seniorityMultiplier: 1.1,
        salaryData: { averageSalary: 112000, medianSalary: 105000, salaryRange: { min: 62000, max: 188000, p25: 82000, p75: 142000 }, currency: '$' },
        similarSkillNames: ["Node.js", "REST API", "GraphQL"],
    },
    {
        name: "Django",
        demandScore: 46, growthRate: 5.8, seniorityMultiplier: 1.2,
        salaryData: { averageSalary: 118000, medianSalary: 112000, salaryRange: { min: 65000, max: 198000, p25: 88000, p75: 150000 }, currency: '$' },
        similarSkillNames: ["Python", "REST API", "PostgreSQL"],
    },
    {
        name: "GraphQL",
        demandScore: 49, growthRate: 12.3, seniorityMultiplier: 1.35,
        salaryData: { averageSalary: 132000, medianSalary: 125000, salaryRange: { min: 75000, max: 225000, p25: 102000, p75: 165000 }, currency: '$' },
        similarSkillNames: ["REST API", "Node.js", "TypeScript"],
    },
    {
        name: "REST API",
        demandScore: 79, growthRate: 1.6, seniorityMultiplier: 1.15,
        salaryData: { averageSalary: 118000, medianSalary: 112000, salaryRange: { min: 65000, max: 205000, p25: 88000, p75: 150000 }, currency: '$' },
        similarSkillNames: ["GraphQL", "Node.js", "Express.js", "Django"],
    },

    // ── Databases ──────────────────────────────────────────────────────────
    {
        name: "PostgreSQL",
        demandScore: 76, growthRate: 14.2, seniorityMultiplier: 1.3,
        salaryData: { averageSalary: 132000, medianSalary: 125000, salaryRange: { min: 75000, max: 225000, p25: 102000, p75: 165000 }, currency: '$' },
        similarSkillNames: ["MySQL", "MongoDB", "SQL", "Redis"],
    },
    {
        name: "MySQL",
        demandScore: 68, growthRate: -3.4, seniorityMultiplier: 1.1,
        salaryData: { averageSalary: 108000, medianSalary: 102000, salaryRange: { min: 58000, max: 185000, p25: 80000, p75: 138000 }, currency: '$' },
        similarSkillNames: ["PostgreSQL", "SQL", "MongoDB"],
    },
    {
        name: "MongoDB",
        demandScore: 62, growthRate: 2.7, seniorityMultiplier: 1.2,
        salaryData: { averageSalary: 118000, medianSalary: 112000, salaryRange: { min: 65000, max: 205000, p25: 88000, p75: 150000 }, currency: '$' },
        similarSkillNames: ["PostgreSQL", "MySQL", "Redis", "SQL"],
    },
    {
        name: "Redis",
        demandScore: 65, growthRate: 8.9, seniorityMultiplier: 1.3,
        salaryData: { averageSalary: 135000, medianSalary: 128000, salaryRange: { min: 78000, max: 232000, p25: 105000, p75: 170000 }, currency: '$' },
        similarSkillNames: ["MongoDB", "PostgreSQL", "AWS"],
    },

    // ── Cloud & DevOps ─────────────────────────────────────────────────────
    {
        name: "AWS",
        demandScore: 84, growthRate: 11.8, seniorityMultiplier: 1.6,
        salaryData: { averageSalary: 158000, medianSalary: 150000, salaryRange: { min: 92000, max: 275000, p25: 125000, p75: 198000 }, currency: '$' },
        similarSkillNames: ["Google Cloud", "Docker", "CI/CD"],
    },
    {
        name: "Google Cloud",
        demandScore: 58, growthRate: 16.4, seniorityMultiplier: 1.55,
        salaryData: { averageSalary: 152000, medianSalary: 145000, salaryRange: { min: 88000, max: 265000, p25: 118000, p75: 192000 }, currency: '$' },
        similarSkillNames: ["AWS", "Docker", "CI/CD"],
    },
    {
        name: "Docker",
        demandScore: 77, growthRate: 10.2, seniorityMultiplier: 1.4,
        salaryData: { averageSalary: 142000, medianSalary: 135000, salaryRange: { min: 82000, max: 248000, p25: 112000, p75: 180000 }, currency: '$' },
        similarSkillNames: ["AWS", "CI/CD", "GitHub Actions", "Go"],
    },
    {
        name: "CI/CD",
        demandScore: 71, growthRate: 13.1, seniorityMultiplier: 1.35,
        salaryData: { averageSalary: 138000, medianSalary: 130000, salaryRange: { min: 78000, max: 238000, p25: 108000, p75: 172000 }, currency: '$' },
        similarSkillNames: ["GitHub Actions", "Docker", "AWS"],
    },
    {
        name: "GitHub Actions",
        demandScore: 62, growthRate: 28.4, seniorityMultiplier: 1.25,
        salaryData: { averageSalary: 128000, medianSalary: 122000, salaryRange: { min: 72000, max: 218000, p25: 98000, p75: 162000 }, currency: '$' },
        similarSkillNames: ["CI/CD", "Docker"],
    },

    // ── AI / ML ────────────────────────────────────────────────────────────
    {
        name: "Machine Learning",
        demandScore: 79, growthRate: 34.6, seniorityMultiplier: 2.0,
        salaryData: { averageSalary: 188000, medianSalary: 178000, salaryRange: { min: 112000, max: 345000, p25: 148000, p75: 248000 }, currency: '$' },
        similarSkillNames: ["Deep Learning", "Data Science", "Python", "scikit-learn", "PyTorch", "TensorFlow", "Natural Language Processing"],
    },
    {
        name: "Deep Learning",
        demandScore: 64, growthRate: 41.2, seniorityMultiplier: 2.1,
        salaryData: { averageSalary: 205000, medianSalary: 195000, salaryRange: { min: 128000, max: 380000, p25: 165000, p75: 272000 }, currency: '$' },
        similarSkillNames: ["Machine Learning", "PyTorch", "TensorFlow", "Natural Language Processing"],
    },
    {
        name: "TensorFlow",
        demandScore: 52, growthRate: 8.3, seniorityMultiplier: 1.8,
        salaryData: { averageSalary: 178000, medianSalary: 168000, salaryRange: { min: 108000, max: 318000, p25: 142000, p75: 232000 }, currency: '$' },
        similarSkillNames: ["PyTorch", "Machine Learning", "Deep Learning", "Python"],
    },
    {
        name: "PyTorch",
        demandScore: 57, growthRate: 46.7, seniorityMultiplier: 1.9,
        salaryData: { averageSalary: 195000, medianSalary: 185000, salaryRange: { min: 122000, max: 358000, p25: 158000, p75: 258000 }, currency: '$' },
        similarSkillNames: ["TensorFlow", "Deep Learning", "Machine Learning", "Python"],
    },
    {
        name: "Natural Language Processing",
        demandScore: 51, growthRate: 52.3, seniorityMultiplier: 2.15,
        salaryData: { averageSalary: 212000, medianSalary: 202000, salaryRange: { min: 135000, max: 395000, p25: 172000, p75: 285000 }, currency: '$' },
        similarSkillNames: ["Machine Learning", "Deep Learning", "PyTorch", "Python"],
    },
    {
        name: "Data Science",
        demandScore: 73, growthRate: 22.8, seniorityMultiplier: 1.75,
        salaryData: { averageSalary: 158000, medianSalary: 148000, salaryRange: { min: 95000, max: 285000, p25: 122000, p75: 205000 }, currency: '$' },
        similarSkillNames: ["Machine Learning", "Python", "pandas", "NumPy", "SQL", "R"],
    },
    {
        name: "pandas",
        demandScore: 61, growthRate: 14.3, seniorityMultiplier: 1.5,
        salaryData: { averageSalary: 142000, medianSalary: 135000, salaryRange: { min: 85000, max: 248000, p25: 112000, p75: 182000 }, currency: '$' },
        similarSkillNames: ["NumPy", "Python", "scikit-learn", "Data Science", "R"],
    },
    {
        name: "NumPy",
        demandScore: 58, growthRate: 11.7, seniorityMultiplier: 1.45,
        salaryData: { averageSalary: 138000, medianSalary: 130000, salaryRange: { min: 82000, max: 238000, p25: 108000, p75: 175000 }, currency: '$' },
        similarSkillNames: ["pandas", "Python", "scikit-learn"],
    },
    {
        name: "scikit-learn",
        demandScore: 54, growthRate: 16.9, seniorityMultiplier: 1.6,
        salaryData: { averageSalary: 152000, medianSalary: 145000, salaryRange: { min: 92000, max: 268000, p25: 120000, p75: 195000 }, currency: '$' },
        similarSkillNames: ["Machine Learning", "pandas", "NumPy", "Python", "TensorFlow"],
    },

    // ── Data & Analytics ───────────────────────────────────────────────────
    {
        name: "SQL",
        demandScore: 86, growthRate: 1.4, seniorityMultiplier: 1.1,
        salaryData: { averageSalary: 108000, medianSalary: 102000, salaryRange: { min: 55000, max: 188000, p25: 78000, p75: 138000 }, currency: '$' },
        similarSkillNames: ["PostgreSQL", "MySQL", "MongoDB", "Data Science", "Excel"],
    },

    // ── Security ───────────────────────────────────────────────────────────
    {
        name: "Cybersecurity",
        demandScore: 72, growthRate: 24.1, seniorityMultiplier: 1.7,
        salaryData: { averageSalary: 162000, medianSalary: 152000, salaryRange: { min: 95000, max: 288000, p25: 128000, p75: 208000 }, currency: '$' },
        similarSkillNames: ["AWS", "Docker", "CI/CD", "HIPAA Compliance"],
    },

    // ── Mobile ─────────────────────────────────────────────────────────────
    {
        name: "React Native",
        demandScore: 53, growthRate: 6.4, seniorityMultiplier: 1.3,
        salaryData: { averageSalary: 128000, medianSalary: 122000, salaryRange: { min: 72000, max: 218000, p25: 98000, p75: 162000 }, currency: '$' },
        similarSkillNames: ["React", "Flutter", "Swift", "Kotlin", "JavaScript"],
    },
    {
        name: "Flutter",
        demandScore: 41, growthRate: 18.7, seniorityMultiplier: 1.3,
        salaryData: { averageSalary: 125000, medianSalary: 118000, salaryRange: { min: 68000, max: 212000, p25: 94000, p75: 158000 }, currency: '$' },
        similarSkillNames: ["React Native", "Kotlin", "Swift"],
    },

    // ── Design ─────────────────────────────────────────────────────────────
    {
        name: "Figma",
        demandScore: 64, growthRate: 21.3, seniorityMultiplier: 1.2,
        salaryData: { averageSalary: 112000, medianSalary: 106000, salaryRange: { min: 62000, max: 190000, p25: 84000, p75: 142000 }, currency: '$' },
        similarSkillNames: ["UI/UX Design", "CSS"],
    },
    {
        name: "UI/UX Design",
        demandScore: 67, growthRate: 8.9, seniorityMultiplier: 1.25,
        salaryData: { averageSalary: 115000, medianSalary: 108000, salaryRange: { min: 64000, max: 195000, p25: 86000, p75: 148000 }, currency: '$' },
        similarSkillNames: ["Figma", "CSS", "Communication"],
    },

    // ── Finance ────────────────────────────────────────────────────────────
    {
        name: "Financial Analysis",
        demandScore: 61, growthRate: 2.3, seniorityMultiplier: 1.4,
        salaryData: { averageSalary: 105000, medianSalary: 98000, salaryRange: { min: 58000, max: 195000, p25: 76000, p75: 138000 }, currency: '$' },
        similarSkillNames: ["Accounting", "Excel", "SQL"],
    },
    {
        name: "Accounting",
        demandScore: 58, growthRate: -1.1, seniorityMultiplier: 1.0,
        salaryData: { averageSalary: 72000, medianSalary: 68000, salaryRange: { min: 42000, max: 132000, p25: 54000, p75: 92000 }, currency: '$' },
        similarSkillNames: ["Financial Analysis", "Excel"],
    },
    {
        name: "Excel",
        demandScore: 72, growthRate: -4.2, seniorityMultiplier: 0.95,
        salaryData: { averageSalary: 82000, medianSalary: 76000, salaryRange: { min: 40000, max: 148000, p25: 58000, p75: 105000 }, currency: '$' },
        similarSkillNames: ["SQL", "Financial Analysis", "Accounting"],
    },

    // ── Healthcare ─────────────────────────────────────────────────────────
    {
        name: "Electronic Health Records",
        demandScore: 48, growthRate: 6.7, seniorityMultiplier: 1.2,
        salaryData: { averageSalary: 78000, medianSalary: 72000, salaryRange: { min: 42000, max: 138000, p25: 58000, p75: 98000 }, currency: '$' },
        similarSkillNames: ["HIPAA Compliance", "Clinical Research"],
    },
    {
        name: "HIPAA Compliance",
        demandScore: 44, growthRate: 5.3, seniorityMultiplier: 1.25,
        salaryData: { averageSalary: 82000, medianSalary: 76000, salaryRange: { min: 45000, max: 145000, p25: 60000, p75: 105000 }, currency: '$' },
        similarSkillNames: ["Electronic Health Records", "Cybersecurity", "Clinical Research"],
    },
    {
        name: "Clinical Research",
        demandScore: 39, growthRate: 8.1, seniorityMultiplier: 1.3,
        salaryData: { averageSalary: 88000, medianSalary: 82000, salaryRange: { min: 48000, max: 158000, p25: 64000, p75: 115000 }, currency: '$' },
        similarSkillNames: ["Electronic Health Records", "HIPAA Compliance", "Data Science"],
    },

    // ── Soft Skills ────────────────────────────────────────────────────────
    // Salaries reflect the wide role distribution that lists these
    {
        name: "Communication",
        demandScore: 88, growthRate: 1.2, seniorityMultiplier: 0.9,
        salaryData: { averageSalary: 88000, medianSalary: 80000, salaryRange: { min: 38000, max: 210000, p25: 55000, p75: 125000 }, currency: '$' },
        similarSkillNames: ["Leadership", "Teamwork", "Critical Thinking", "Problem Solving"],
    },
    {
        name: "Leadership",
        demandScore: 74, growthRate: 2.8, seniorityMultiplier: 1.15,
        salaryData: { averageSalary: 148000, medianSalary: 138000, salaryRange: { min: 65000, max: 295000, p25: 102000, p75: 198000 }, currency: '$' },
        similarSkillNames: ["Communication", "Critical Thinking", "Problem Solving", "Teamwork"],
    },
    {
        name: "Problem Solving",
        demandScore: 81, growthRate: 1.5, seniorityMultiplier: 0.95,
        salaryData: { averageSalary: 102000, medianSalary: 95000, salaryRange: { min: 45000, max: 245000, p25: 68000, p75: 145000 }, currency: '$' },
        similarSkillNames: ["Critical Thinking", "Communication", "Leadership", "Teamwork"],
    },
    {
        name: "Teamwork",
        demandScore: 76, growthRate: 0.8, seniorityMultiplier: 0.85,
        salaryData: { averageSalary: 82000, medianSalary: 75000, salaryRange: { min: 35000, max: 195000, p25: 52000, p75: 118000 }, currency: '$' },
        similarSkillNames: ["Communication", "Leadership", "Problem Solving"],
    },
    {
        name: "Critical Thinking",
        demandScore: 68, growthRate: 3.4, seniorityMultiplier: 0.9,
        salaryData: { averageSalary: 95000, medianSalary: 88000, salaryRange: { min: 42000, max: 228000, p25: 62000, p75: 135000 }, currency: '$' },
        similarSkillNames: ["Problem Solving", "Communication", "Leadership"],
    },
];

// ============================================
// SIMILAR SKILL SCORES
// ============================================

/**
 * Similarity scores (0–1) for skill pairs.
 * 0.9+ = near-identical (TensorFlow/PyTorch — both DL frameworks)
 * 0.7–0.89 = strongly related, often co-listed
 * 0.5–0.69 = related, same domain, different purpose
 * < 0.5 = loosely related, different domain but co-occurring
 *
 * Key format: "SkillA|||SkillB" (alphabetical order, always)
 * The enrichment pass uses this bidirectionally.
 */
const SIMILAR_SKILL_SCORES: Record<string, number> = {
    // AI/ML cluster
    "Deep Learning|||Machine Learning":               0.92,
    "Deep Learning|||Natural Language Processing":    0.85,
    "Deep Learning|||PyTorch":                        0.90,
    "Deep Learning|||TensorFlow":                     0.88,
    "Machine Learning|||Natural Language Processing": 0.83,
    "Machine Learning|||PyTorch":                     0.87,
    "Machine Learning|||TensorFlow":                  0.85,
    "Machine Learning|||scikit-learn":                0.84,
    "Machine Learning|||Data Science":                0.80,
    "Machine Learning|||Python":                      0.75,
    "PyTorch|||TensorFlow":                           0.92,
    "Natural Language Processing|||PyTorch":          0.82,
    "pandas|||NumPy":                                 0.88,
    "pandas|||Python":                                0.80,
    "pandas|||scikit-learn":                          0.76,
    "NumPy|||Python":                                 0.78,
    "NumPy|||scikit-learn":                           0.74,
    "Data Science|||Python":                          0.78,
    "R|||Data Science":                               0.72,
    "R|||pandas":                                     0.70,
    "scikit-learn|||Python":                          0.80,

    // JavaScript ecosystem
    "JavaScript|||TypeScript":                        0.90,
    "JavaScript|||Node.js":                           0.85,
    "JavaScript|||React":                             0.82,
    "TypeScript|||Node.js":                           0.80,
    "TypeScript|||React":                             0.84,
    "React|||Next.js":                                0.88,
    "React|||Vue.js":                                 0.72,
    "React|||Angular":                                0.70,
    "React|||React Native":                           0.82,
    "Angular|||TypeScript":                           0.78,
    "Next.js|||Node.js":                              0.74,
    "HTML|||CSS":                                     0.88,
    "CSS|||Tailwind CSS":                             0.84,
    "HTML|||JavaScript":                              0.72,
    "Node.js|||Express.js":                           0.86,
    "GraphQL|||REST API":                             0.74,
    "GraphQL|||Node.js":                              0.70,

    // Cloud/DevOps cluster
    "AWS|||Docker":                                   0.72,
    "AWS|||CI/CD":                                    0.75,
    "AWS|||Google Cloud":                             0.78,
    "Docker|||CI/CD":                                 0.82,
    "Docker|||GitHub Actions":                        0.74,
    "CI/CD|||GitHub Actions":                         0.86,
    "AWS|||Cybersecurity":                            0.56,
    "Cybersecurity|||HIPAA Compliance":               0.60,

    // Database cluster
    "PostgreSQL|||MySQL":                             0.84,
    "PostgreSQL|||SQL":                               0.86,
    "MySQL|||SQL":                                    0.84,
    "MongoDB|||PostgreSQL":                           0.70,
    "MongoDB|||Redis":                                0.65,
    "MongoDB|||SQL":                                  0.62,
    "PostgreSQL|||Redis":                             0.62,

    // Python backend
    "Django|||Python":                                0.78,
    "Django|||REST API":                              0.70,
    "Django|||PostgreSQL":                            0.65,
    "Python|||Go":                                    0.58,
    "Python|||Rust":                                  0.52,
    "Go|||Rust":                                      0.72,
    "Go|||Docker":                                    0.65,
    "C++|||Rust":                                     0.74,

    // JVM cluster
    "Java|||Kotlin":                                  0.88,
    "Java|||Scala":                                   0.78,
    "Kotlin|||Scala":                                 0.72,
    "Java|||C#":                                      0.65,
    "C#|||Kotlin":                                    0.60,

    // Mobile
    "Swift|||Kotlin":                                 0.74,
    "React Native|||Flutter":                         0.80,
    "React Native|||Swift":                           0.62,
    "Flutter|||Kotlin":                               0.68,

    // Design
    "Figma|||UI/UX Design":                           0.88,
    "CSS|||Figma":                                    0.58,
    "CSS|||UI/UX Design":                             0.58,

    // Finance
    "Accounting|||Financial Analysis":                0.80,
    "Excel|||Financial Analysis":                     0.76,
    "Accounting|||Excel":                             0.78,
    "Excel|||SQL":                                    0.60,

    // Healthcare
    "Electronic Health Records|||HIPAA Compliance":   0.82,
    "Clinical Research|||Electronic Health Records":  0.72,
    "Clinical Research|||HIPAA Compliance":           0.68,

    // Soft skills
    "Communication|||Leadership":                     0.74,
    "Communication|||Problem Solving":                0.68,
    "Communication|||Teamwork":                       0.72,
    "Leadership|||Problem Solving":                   0.70,
    "Leadership|||Teamwork":                          0.68,
    "Critical Thinking|||Problem Solving":            0.84,
    "Communication|||Critical Thinking":              0.66,
};

function getSkillSimilarityScore(a: string, b: string): number {
    const key = [a, b].sort().join('|||');
    return SIMILAR_SKILL_SCORES[key] ?? 0.5;
}

// ============================================
// SIMILAR JOB SCORES
// ============================================

/**
 * Similarity scores for job title pairs (0–1).
 * 0.9+ = near-identical, different seniority
 * 0.7–0.89 = strongly related, common lateral move
 * 0.5–0.69 = same domain, different focus
 *
 * Key format: "TitleA|||TitleB" (alphabetical order, always)
 */
const SIMILAR_JOB_SCORES: Record<string, number> = {
    // Same normalized title — seniority ladder
    "Junior Software Engineer|||Software Engineer":                   0.92,
    "Senior Software Engineer|||Software Engineer":                   0.92,
    "Junior Software Engineer|||Senior Software Engineer":            0.82,
    "Frontend Engineer|||Senior Frontend Engineer":                   0.92,
    "Backend Engineer|||Senior Backend Engineer":                     0.92,
    "Full Stack Engineer|||Senior Full Stack Engineer":               0.92,
    "Data Scientist|||Senior Data Scientist":                         0.92,
    "Data Engineer|||Senior Data Engineer":                           0.92,
    "Data Analyst|||Senior Data Analyst":                             0.92,
    "Machine Learning Engineer|||Senior Machine Learning Engineer":   0.92,
    "DevOps Engineer|||Senior DevOps Engineer":                       0.92,
    "Product Manager|||Senior Product Manager":                       0.92,
    "Software Engineer|||Software Engineering Intern":                0.80,

    // Cross-specialisation within engineering
    "Frontend Engineer|||Full Stack Engineer":                        0.80,
    "Backend Engineer|||Full Stack Engineer":                         0.82,
    "Frontend Engineer|||Backend Engineer":                           0.70,
    "Full Stack Engineer|||Software Engineer":                        0.82,
    "Frontend Engineer|||Software Engineer":                          0.76,
    "Backend Engineer|||Software Engineer":                           0.78,
    "Senior Full Stack Engineer|||Senior Software Engineer":          0.82,
    "Senior Frontend Engineer|||Senior Full Stack Engineer":          0.80,
    "Senior Backend Engineer|||Senior Full Stack Engineer":           0.82,
    "Junior Software Engineer|||Software Engineering Intern":         0.85,

    // Data cluster
    "Data Scientist|||Machine Learning Engineer":                     0.82,
    "Data Engineer|||Data Scientist":                                 0.72,
    "Data Analyst|||Data Scientist":                                  0.74,
    "Data Engineer|||Machine Learning Engineer":                      0.70,
    "Data Analyst|||Data Engineer":                                   0.68,
    "Senior Data Scientist|||Senior Machine Learning Engineer":       0.82,
    "Data Analyst|||Financial Analyst":                               0.62,

    // DevOps / Cloud
    "Cloud Engineer|||DevOps Engineer":                               0.84,
    "Cloud Engineer|||Senior DevOps Engineer":                        0.78,
    "Backend Engineer|||DevOps Engineer":                             0.66,
    "Backend Engineer|||Cloud Engineer":                              0.60,

    // Senior cross-specialisation
    "Senior Backend Engineer|||Senior Software Engineer":             0.78,
    "Senior Frontend Engineer|||Senior Software Engineer":            0.76,
    "Senior Data Engineer|||Senior Machine Learning Engineer":        0.72,
    "Senior Data Engineer|||Senior Data Scientist":                   0.75,

    // Finance
    "Accountant|||Financial Analyst":                                 0.72,
    "Financial Analyst|||Investment Banker":                          0.70,
    "Accountant|||Investment Banker":                                 0.65,

    // Healthcare
    "Physician|||Registered Nurse":                                   0.65,

    // Marketing
    "Digital Marketing Specialist|||Marketing Manager":               0.80,

    // Cross-domain
    "Product Manager|||UX Designer":                                  0.66,
    "Marketing Manager|||Product Manager":                            0.62,
    "Data Scientist|||Software Engineer":                             0.58,
};

function getJobSimilarityScore(a: string, b: string): number {
    const key = [a, b].sort().join('|||');
    return SIMILAR_JOB_SCORES[key] ?? 0.5;
}

// ============================================
// JOB TITLE SEED DATA
// ============================================

const JOB_TITLE_SEED_DATA: (JobTitleSeed & {
    demandMetrics?: { demandScore: number; monthlyGrowth: number; competitionRatio: number };
    trendData?: { isGrowing: boolean; growthRate: number };
    salaryData?: { averageSalary: number; medianSalary: number; salaryRange: { min: number; max: number; p25: number; p75: number }; currency: string };
    similarJobNames?: string[];
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
        similarJobNames: ["Junior Software Engineer", "Senior Software Engineer", "Full Stack Engineer", "Frontend Engineer", "Backend Engineer", "Software Engineering Intern"],
        topSkills: [
            { skillName: "JavaScript",    frequency: 72, importance: 'Required'    },
            { skillName: "Python",        frequency: 65, importance: 'Required'    },
            { skillName: "TypeScript",    frequency: 58, importance: 'Preferred'   },
            { skillName: "REST API",      frequency: 74, importance: 'Required'    },
            { skillName: "SQL",           frequency: 61, importance: 'Required'    },
            { skillName: "Docker",        frequency: 48, importance: 'Preferred'   },
            { skillName: "PostgreSQL",    frequency: 44, importance: 'Preferred'   },
            { skillName: "Problem Solving", frequency: 80, importance: 'Required' },
            { skillName: "Communication", frequency: 68, importance: 'Preferred'   },
        ],
    },
    {
        title: "Junior Software Engineer",
        normalizedTitle: "Software Engineer",
        industry: "Technology",
        seniorityLevel: "Entry",
        demandMetrics: { demandScore: 74, monthlyGrowth: 1.4, competitionRatio: 8.7 },
        trendData:     { isGrowing: true, growthRate: 5.1 },
        salaryData:    { averageSalary: 82000, medianSalary: 80000, salaryRange: { min: 65000, max: 100000, p25: 72000, p75: 92000 }, currency: '$' },
        similarJobNames: ["Software Engineer", "Software Engineering Intern"],
        topSkills: [
            { skillName: "JavaScript",    frequency: 78, importance: 'Required'    },
            { skillName: "Python",        frequency: 60, importance: 'Required'    },
            { skillName: "HTML",          frequency: 65, importance: 'Required'    },
            { skillName: "CSS",           frequency: 62, importance: 'Required'    },
            { skillName: "SQL",           frequency: 54, importance: 'Preferred'   },
            { skillName: "REST API",      frequency: 55, importance: 'Preferred'   },
            { skillName: "Problem Solving", frequency: 82, importance: 'Required' },
            { skillName: "Teamwork",      frequency: 74, importance: 'Required'    },
            { skillName: "Communication", frequency: 70, importance: 'Preferred'   },
        ],
    },
    {
        title: "Senior Software Engineer",
        normalizedTitle: "Software Engineer",
        industry: "Technology",
        seniorityLevel: "Senior",
        demandMetrics: { demandScore: 85, monthlyGrowth: 2.8, competitionRatio: 2.9 },
        trendData:     { isGrowing: true, growthRate: 10.2 },
        salaryData:    { averageSalary: 185000, medianSalary: 178000, salaryRange: { min: 155000, max: 240000, p25: 165000, p75: 210000 }, currency: '$' },
        similarJobNames: ["Software Engineer", "Senior Full Stack Engineer", "Senior Backend Engineer", "Senior Frontend Engineer"],
        topSkills: [
            { skillName: "Python",        frequency: 72, importance: 'Required'    },
            { skillName: "TypeScript",    frequency: 68, importance: 'Required'    },
            { skillName: "REST API",      frequency: 78, importance: 'Required'    },
            { skillName: "PostgreSQL",    frequency: 58, importance: 'Required'    },
            { skillName: "Docker",        frequency: 65, importance: 'Required'    },
            { skillName: "AWS",           frequency: 60, importance: 'Preferred'   },
            { skillName: "CI/CD",         frequency: 62, importance: 'Preferred'   },
            { skillName: "Redis",         frequency: 44, importance: 'Preferred'   },
            { skillName: "Leadership",    frequency: 56, importance: 'Preferred'   },
            { skillName: "Problem Solving", frequency: 84, importance: 'Required' },
        ],
    },
    {
        title: "Software Engineering Intern",
        normalizedTitle: "Software Engineer",
        industry: "Technology",
        seniorityLevel: "Intern",
        demandMetrics: { demandScore: 62, monthlyGrowth: 4.3, competitionRatio: 14.6 },
        trendData:     { isGrowing: true, growthRate: 6.7 },
        salaryData:    { averageSalary: 38000, medianSalary: 36000, salaryRange: { min: 26000, max: 54000, p25: 30000, p75: 48000 }, currency: '$' },
        similarJobNames: ["Junior Software Engineer", "Software Engineer"],
        topSkills: [
            { skillName: "JavaScript",    frequency: 70, importance: 'Required'    },
            { skillName: "Python",        frequency: 68, importance: 'Required'    },
            { skillName: "HTML",          frequency: 60, importance: 'Required'    },
            { skillName: "CSS",           frequency: 58, importance: 'Required'    },
            { skillName: "SQL",           frequency: 45, importance: 'Preferred'   },
            { skillName: "Problem Solving", frequency: 80, importance: 'Required' },
            { skillName: "Teamwork",      frequency: 78, importance: 'Required'    },
            { skillName: "Communication", frequency: 72, importance: 'Required'    },
        ],
    },
    {
        title: "Frontend Engineer",
        normalizedTitle: "Frontend Engineer",
        industry: "Technology",
        seniorityLevel: "Mid-Level",
        demandMetrics: { demandScore: 80, monthlyGrowth: 1.8, competitionRatio: 5.1 },
        trendData:     { isGrowing: true, growthRate: 7.4 },
        salaryData:    { averageSalary: 128000, medianSalary: 124000, salaryRange: { min: 105000, max: 158000, p25: 115000, p75: 142000 }, currency: '$' },
        similarJobNames: ["Senior Frontend Engineer", "Full Stack Engineer", "Software Engineer", "UX Designer"],
        topSkills: [
            { skillName: "React",         frequency: 82, importance: 'Required'    },
            { skillName: "TypeScript",    frequency: 74, importance: 'Required'    },
            { skillName: "JavaScript",    frequency: 88, importance: 'Required'    },
            { skillName: "HTML",          frequency: 90, importance: 'Required'    },
            { skillName: "CSS",           frequency: 88, importance: 'Required'    },
            { skillName: "Next.js",       frequency: 55, importance: 'Preferred'   },
            { skillName: "Tailwind CSS",  frequency: 52, importance: 'Preferred'   },
            { skillName: "REST API",      frequency: 65, importance: 'Preferred'   },
            { skillName: "GraphQL",       frequency: 38, importance: 'Nice-to-Have'},
            { skillName: "Figma",         frequency: 48, importance: 'Preferred'   },
        ],
    },
    {
        title: "Senior Frontend Engineer",
        normalizedTitle: "Frontend Engineer",
        industry: "Technology",
        seniorityLevel: "Senior",
        demandMetrics: { demandScore: 76, monthlyGrowth: 2.3, competitionRatio: 3.4 },
        trendData:     { isGrowing: true, growthRate: 9.1 },
        salaryData:    { averageSalary: 172000, medianSalary: 165000, salaryRange: { min: 145000, max: 215000, p25: 155000, p75: 195000 }, currency: '$' },
        similarJobNames: ["Frontend Engineer", "Senior Full Stack Engineer", "Senior Software Engineer"],
        topSkills: [
            { skillName: "React",         frequency: 86, importance: 'Required'    },
            { skillName: "TypeScript",    frequency: 82, importance: 'Required'    },
            { skillName: "JavaScript",    frequency: 88, importance: 'Required'    },
            { skillName: "Next.js",       frequency: 68, importance: 'Required'    },
            { skillName: "HTML",          frequency: 85, importance: 'Required'    },
            { skillName: "CSS",           frequency: 84, importance: 'Required'    },
            { skillName: "Tailwind CSS",  frequency: 58, importance: 'Preferred'   },
            { skillName: "GraphQL",       frequency: 48, importance: 'Preferred'   },
            { skillName: "REST API",      frequency: 66, importance: 'Preferred'   },
            { skillName: "Figma",         frequency: 52, importance: 'Preferred'   },
            { skillName: "Leadership",    frequency: 42, importance: 'Nice-to-Have'},
        ],
    },
    {
        title: "Backend Engineer",
        normalizedTitle: "Backend Engineer",
        industry: "Technology",
        seniorityLevel: "Mid-Level",
        demandMetrics: { demandScore: 82, monthlyGrowth: 2.0, competitionRatio: 4.6 },
        trendData:     { isGrowing: true, growthRate: 8.8 },
        salaryData:    { averageSalary: 138000, medianSalary: 133000, salaryRange: { min: 112000, max: 168000, p25: 122000, p75: 155000 }, currency: '$' },
        similarJobNames: ["Senior Backend Engineer", "Full Stack Engineer", "Software Engineer", "DevOps Engineer"],
        topSkills: [
            { skillName: "Python",        frequency: 68, importance: 'Required'    },
            { skillName: "Node.js",       frequency: 62, importance: 'Required'    },
            { skillName: "REST API",      frequency: 85, importance: 'Required'    },
            { skillName: "PostgreSQL",    frequency: 66, importance: 'Required'    },
            { skillName: "SQL",           frequency: 72, importance: 'Required'    },
            { skillName: "Docker",        frequency: 58, importance: 'Preferred'   },
            { skillName: "Redis",         frequency: 52, importance: 'Preferred'   },
            { skillName: "MongoDB",       frequency: 46, importance: 'Preferred'   },
            { skillName: "AWS",           frequency: 48, importance: 'Preferred'   },
            { skillName: "GraphQL",       frequency: 36, importance: 'Nice-to-Have'},
        ],
    },
    {
        title: "Senior Backend Engineer",
        normalizedTitle: "Backend Engineer",
        industry: "Technology",
        seniorityLevel: "Senior",
        demandMetrics: { demandScore: 79, monthlyGrowth: 2.6, competitionRatio: 3.1 },
        trendData:     { isGrowing: true, growthRate: 11.4 },
        salaryData:    { averageSalary: 192000, medianSalary: 185000, salaryRange: { min: 160000, max: 248000, p25: 172000, p75: 220000 }, currency: '$' },
        similarJobNames: ["Backend Engineer", "Senior Full Stack Engineer", "Senior Software Engineer", "Senior DevOps Engineer"],
        topSkills: [
            { skillName: "Python",        frequency: 72, importance: 'Required'    },
            { skillName: "Node.js",       frequency: 60, importance: 'Required'    },
            { skillName: "REST API",      frequency: 86, importance: 'Required'    },
            { skillName: "PostgreSQL",    frequency: 70, importance: 'Required'    },
            { skillName: "SQL",           frequency: 74, importance: 'Required'    },
            { skillName: "Docker",        frequency: 68, importance: 'Required'    },
            { skillName: "AWS",           frequency: 62, importance: 'Required'    },
            { skillName: "Redis",         frequency: 60, importance: 'Preferred'   },
            { skillName: "CI/CD",         frequency: 58, importance: 'Preferred'   },
            { skillName: "Go",            frequency: 34, importance: 'Nice-to-Have'},
            { skillName: "Leadership",    frequency: 48, importance: 'Preferred'   },
        ],
    },
    {
        title: "Full Stack Engineer",
        normalizedTitle: "Full Stack Engineer",
        industry: "Technology",
        seniorityLevel: "Mid-Level",
        demandMetrics: { demandScore: 84, monthlyGrowth: 1.9, competitionRatio: 5.8 },
        trendData:     { isGrowing: true, growthRate: 6.9 },
        salaryData:    { averageSalary: 132000, medianSalary: 127000, salaryRange: { min: 108000, max: 162000, p25: 118000, p75: 148000 }, currency: '$' },
        similarJobNames: ["Senior Full Stack Engineer", "Frontend Engineer", "Backend Engineer", "Software Engineer"],
        topSkills: [
            { skillName: "JavaScript",    frequency: 88, importance: 'Required'    },
            { skillName: "TypeScript",    frequency: 64, importance: 'Preferred'   },
            { skillName: "React",         frequency: 76, importance: 'Required'    },
            { skillName: "Node.js",       frequency: 72, importance: 'Required'    },
            { skillName: "REST API",      frequency: 80, importance: 'Required'    },
            { skillName: "SQL",           frequency: 65, importance: 'Required'    },
            { skillName: "PostgreSQL",    frequency: 52, importance: 'Preferred'   },
            { skillName: "MongoDB",       frequency: 48, importance: 'Preferred'   },
            { skillName: "Docker",        frequency: 44, importance: 'Preferred'   },
            { skillName: "HTML",          frequency: 84, importance: 'Required'    },
            { skillName: "CSS",           frequency: 82, importance: 'Required'    },
        ],
    },
    {
        title: "Senior Full Stack Engineer",
        normalizedTitle: "Full Stack Engineer",
        industry: "Technology",
        seniorityLevel: "Senior",
        demandMetrics: { demandScore: 77, monthlyGrowth: 2.4, competitionRatio: 3.8 },
        trendData:     { isGrowing: true, growthRate: 9.7 },
        salaryData:    { averageSalary: 178000, medianSalary: 172000, salaryRange: { min: 150000, max: 228000, p25: 160000, p75: 205000 }, currency: '$' },
        similarJobNames: ["Full Stack Engineer", "Senior Frontend Engineer", "Senior Backend Engineer", "Senior Software Engineer"],
        topSkills: [
            { skillName: "TypeScript",    frequency: 76, importance: 'Required'    },
            { skillName: "React",         frequency: 80, importance: 'Required'    },
            { skillName: "Next.js",       frequency: 60, importance: 'Preferred'   },
            { skillName: "Node.js",       frequency: 74, importance: 'Required'    },
            { skillName: "REST API",      frequency: 82, importance: 'Required'    },
            { skillName: "PostgreSQL",    frequency: 60, importance: 'Required'    },
            { skillName: "Docker",        frequency: 58, importance: 'Required'    },
            { skillName: "AWS",           frequency: 52, importance: 'Preferred'   },
            { skillName: "Redis",         frequency: 46, importance: 'Preferred'   },
            { skillName: "CI/CD",         frequency: 50, importance: 'Preferred'   },
            { skillName: "Leadership",    frequency: 44, importance: 'Nice-to-Have'},
        ],
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
        similarJobNames: ["Senior Data Scientist", "Machine Learning Engineer", "Data Engineer", "Data Analyst"],
        topSkills: [
            { skillName: "Python",        frequency: 92, importance: 'Required'    },
            { skillName: "Machine Learning", frequency: 86, importance: 'Required' },
            { skillName: "SQL",           frequency: 80, importance: 'Required'    },
            { skillName: "pandas",        frequency: 82, importance: 'Required'    },
            { skillName: "NumPy",         frequency: 76, importance: 'Required'    },
            { skillName: "scikit-learn",  frequency: 72, importance: 'Required'    },
            { skillName: "Data Science",  frequency: 88, importance: 'Required'    },
            { skillName: "Deep Learning", frequency: 54, importance: 'Preferred'   },
            { skillName: "TensorFlow",    frequency: 46, importance: 'Preferred'   },
            { skillName: "PyTorch",       frequency: 48, importance: 'Preferred'   },
            { skillName: "R",             frequency: 38, importance: 'Nice-to-Have'},
        ],
    },
    {
        title: "Senior Data Scientist",
        normalizedTitle: "Data Scientist",
        industry: "Technology",
        seniorityLevel: "Senior",
        demandMetrics: { demandScore: 72, monthlyGrowth: 3.9, competitionRatio: 2.6 },
        trendData:     { isGrowing: true, growthRate: 19.8 },
        salaryData:    { averageSalary: 208000, medianSalary: 198000, salaryRange: { min: 172000, max: 275000, p25: 185000, p75: 240000 }, currency: '$' },
        similarJobNames: ["Data Scientist", "Senior Machine Learning Engineer", "Senior Data Engineer"],
        topSkills: [
            { skillName: "Python",        frequency: 94, importance: 'Required'    },
            { skillName: "Machine Learning", frequency: 90, importance: 'Required' },
            { skillName: "Deep Learning", frequency: 72, importance: 'Required'    },
            { skillName: "SQL",           frequency: 82, importance: 'Required'    },
            { skillName: "pandas",        frequency: 80, importance: 'Required'    },
            { skillName: "PyTorch",       frequency: 64, importance: 'Required'    },
            { skillName: "TensorFlow",    frequency: 58, importance: 'Preferred'   },
            { skillName: "scikit-learn",  frequency: 70, importance: 'Required'    },
            { skillName: "Natural Language Processing", frequency: 52, importance: 'Preferred' },
            { skillName: "Data Science",  frequency: 88, importance: 'Required'    },
            { skillName: "Leadership",    frequency: 54, importance: 'Preferred'   },
        ],
    },
    {
        title: "Data Engineer",
        normalizedTitle: "Data Engineer",
        industry: "Technology",
        seniorityLevel: "Mid-Level",
        demandMetrics: { demandScore: 75, monthlyGrowth: 4.1, competitionRatio: 3.2 },
        trendData:     { isGrowing: true, growthRate: 22.4 },
        salaryData:    { averageSalary: 152000, medianSalary: 146000, salaryRange: { min: 122000, max: 190000, p25: 134000, p75: 172000 }, currency: '$' },
        similarJobNames: ["Senior Data Engineer", "Data Scientist", "Data Analyst", "Backend Engineer"],
        topSkills: [
            { skillName: "Python",        frequency: 88, importance: 'Required'    },
            { skillName: "SQL",           frequency: 90, importance: 'Required'    },
            { skillName: "PostgreSQL",    frequency: 62, importance: 'Preferred'   },
            { skillName: "AWS",           frequency: 64, importance: 'Preferred'   },
            { skillName: "Docker",        frequency: 54, importance: 'Preferred'   },
            { skillName: "Scala",         frequency: 36, importance: 'Nice-to-Have'},
            { skillName: "pandas",        frequency: 66, importance: 'Preferred'   },
            { skillName: "MongoDB",       frequency: 42, importance: 'Nice-to-Have'},
            { skillName: "CI/CD",         frequency: 48, importance: 'Preferred'   },
            { skillName: "Problem Solving", frequency: 76, importance: 'Required' },
        ],
    },
    {
        title: "Senior Data Engineer",
        normalizedTitle: "Data Engineer",
        industry: "Technology",
        seniorityLevel: "Senior",
        demandMetrics: { demandScore: 68, monthlyGrowth: 4.6, competitionRatio: 2.3 },
        trendData:     { isGrowing: true, growthRate: 26.1 },
        salaryData:    { averageSalary: 212000, medianSalary: 202000, salaryRange: { min: 175000, max: 280000, p25: 188000, p75: 248000 }, currency: '$' },
        similarJobNames: ["Data Engineer", "Senior Data Scientist", "Senior Machine Learning Engineer"],
        topSkills: [
            { skillName: "Python",        frequency: 90, importance: 'Required'    },
            { skillName: "SQL",           frequency: 90, importance: 'Required'    },
            { skillName: "AWS",           frequency: 72, importance: 'Required'    },
            { skillName: "Docker",        frequency: 64, importance: 'Required'    },
            { skillName: "CI/CD",         frequency: 60, importance: 'Preferred'   },
            { skillName: "PostgreSQL",    frequency: 64, importance: 'Preferred'   },
            { skillName: "Scala",         frequency: 44, importance: 'Preferred'   },
            { skillName: "Google Cloud",  frequency: 42, importance: 'Nice-to-Have'},
            { skillName: "Redis",         frequency: 46, importance: 'Preferred'   },
            { skillName: "Leadership",    frequency: 50, importance: 'Preferred'   },
        ],
    },
    {
        title: "Data Analyst",
        normalizedTitle: "Data Analyst",
        industry: "Technology",
        seniorityLevel: "Entry",
        demandMetrics: { demandScore: 71, monthlyGrowth: 1.6, competitionRatio: 9.4 },
        trendData:     { isGrowing: true, growthRate: 7.3 },
        salaryData:    { averageSalary: 72000, medianSalary: 68000, salaryRange: { min: 52000, max: 92000, p25: 60000, p75: 82000 }, currency: '$' },
        similarJobNames: ["Senior Data Analyst", "Data Scientist", "Data Engineer", "Financial Analyst"],
        topSkills: [
            { skillName: "SQL",           frequency: 92, importance: 'Required'    },
            { skillName: "Excel",         frequency: 82, importance: 'Required'    },
            { skillName: "Python",        frequency: 58, importance: 'Preferred'   },
            { skillName: "pandas",        frequency: 52, importance: 'Preferred'   },
            { skillName: "Data Science",  frequency: 44, importance: 'Preferred'   },
            { skillName: "Communication", frequency: 74, importance: 'Required'    },
            { skillName: "Problem Solving", frequency: 78, importance: 'Required' },
            { skillName: "Critical Thinking", frequency: 66, importance: 'Preferred' },
        ],
    },
    {
        title: "Senior Data Analyst",
        normalizedTitle: "Data Analyst",
        industry: "Technology",
        seniorityLevel: "Mid-Level",
        demandMetrics: { demandScore: 66, monthlyGrowth: 2.1, competitionRatio: 5.7 },
        trendData:     { isGrowing: true, growthRate: 9.8 },
        salaryData:    { averageSalary: 108000, medianSalary: 103000, salaryRange: { min: 85000, max: 135000, p25: 94000, p75: 120000 }, currency: '$' },
        similarJobNames: ["Data Analyst", "Data Scientist", "Data Engineer"],
        topSkills: [
            { skillName: "SQL",           frequency: 92, importance: 'Required'    },
            { skillName: "Excel",         frequency: 78, importance: 'Required'    },
            { skillName: "Python",        frequency: 68, importance: 'Required'    },
            { skillName: "pandas",        frequency: 60, importance: 'Preferred'   },
            { skillName: "PostgreSQL",    frequency: 50, importance: 'Preferred'   },
            { skillName: "Data Science",  frequency: 52, importance: 'Preferred'   },
            { skillName: "Communication", frequency: 72, importance: 'Required'    },
            { skillName: "Leadership",    frequency: 46, importance: 'Nice-to-Have'},
            { skillName: "Critical Thinking", frequency: 68, importance: 'Preferred' },
        ],
    },
    {
        title: "Machine Learning Engineer",
        normalizedTitle: "Machine Learning Engineer",
        industry: "Technology",
        seniorityLevel: "Mid-Level",
        demandMetrics: { demandScore: 73, monthlyGrowth: 7.8, competitionRatio: 2.1 },
        trendData:     { isGrowing: true, growthRate: 41.6 },
        salaryData:    { averageSalary: 182000, medianSalary: 175000, salaryRange: { min: 148000, max: 238000, p25: 162000, p75: 215000 }, currency: '$' },
        similarJobNames: ["Senior Machine Learning Engineer", "Data Scientist", "Data Engineer"],
        topSkills: [
            { skillName: "Python",        frequency: 96, importance: 'Required'    },
            { skillName: "Machine Learning", frequency: 96, importance: 'Required' },
            { skillName: "Deep Learning", frequency: 80, importance: 'Required'    },
            { skillName: "PyTorch",       frequency: 74, importance: 'Required'    },
            { skillName: "TensorFlow",    frequency: 64, importance: 'Preferred'   },
            { skillName: "scikit-learn",  frequency: 70, importance: 'Required'    },
            { skillName: "SQL",           frequency: 58, importance: 'Preferred'   },
            { skillName: "pandas",        frequency: 72, importance: 'Required'    },
            { skillName: "NumPy",         frequency: 68, importance: 'Required'    },
            { skillName: "Docker",        frequency: 52, importance: 'Preferred'   },
            { skillName: "AWS",           frequency: 48, importance: 'Preferred'   },
            { skillName: "Natural Language Processing", frequency: 54, importance: 'Preferred' },
        ],
    },
    {
        title: "Senior Machine Learning Engineer",
        normalizedTitle: "Machine Learning Engineer",
        industry: "Technology",
        seniorityLevel: "Senior",
        demandMetrics: { demandScore: 69, monthlyGrowth: 9.2, competitionRatio: 1.6 },
        trendData:     { isGrowing: true, growthRate: 52.3 },
        salaryData:    { averageSalary: 258000, medianSalary: 245000, salaryRange: { min: 210000, max: 380000, p25: 228000, p75: 310000 }, currency: '$' },
        similarJobNames: ["Machine Learning Engineer", "Senior Data Scientist", "Senior Data Engineer"],
        topSkills: [
            { skillName: "Python",        frequency: 96, importance: 'Required'    },
            { skillName: "Machine Learning", frequency: 96, importance: 'Required' },
            { skillName: "Deep Learning", frequency: 88, importance: 'Required'    },
            { skillName: "PyTorch",       frequency: 82, importance: 'Required'    },
            { skillName: "TensorFlow",    frequency: 68, importance: 'Preferred'   },
            { skillName: "Natural Language Processing", frequency: 70, importance: 'Required' },
            { skillName: "scikit-learn",  frequency: 66, importance: 'Required'    },
            { skillName: "Docker",        frequency: 62, importance: 'Required'    },
            { skillName: "AWS",           frequency: 60, importance: 'Preferred'   },
            { skillName: "Data Science",  frequency: 72, importance: 'Required'    },
            { skillName: "Leadership",    frequency: 56, importance: 'Preferred'   },
        ],
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
        similarJobNames: ["Senior DevOps Engineer", "Cloud Engineer", "Backend Engineer"],
        topSkills: [
            { skillName: "AWS",           frequency: 82, importance: 'Required'    },
            { skillName: "Docker",        frequency: 88, importance: 'Required'    },
            { skillName: "CI/CD",         frequency: 90, importance: 'Required'    },
            { skillName: "GitHub Actions", frequency: 72, importance: 'Required'   },
            { skillName: "Python",        frequency: 52, importance: 'Preferred'   },
            { skillName: "Google Cloud",  frequency: 48, importance: 'Preferred'   },
            { skillName: "Cybersecurity", frequency: 44, importance: 'Preferred'   },
            { skillName: "Problem Solving", frequency: 76, importance: 'Required' },
        ],
    },
    {
        title: "Senior DevOps Engineer",
        normalizedTitle: "DevOps Engineer",
        industry: "Technology",
        seniorityLevel: "Senior",
        demandMetrics: { demandScore: 71, monthlyGrowth: 3.4, competitionRatio: 2.4 },
        trendData:     { isGrowing: true, growthRate: 17.9 },
        salaryData:    { averageSalary: 198000, medianSalary: 188000, salaryRange: { min: 162000, max: 258000, p25: 175000, p75: 228000 }, currency: '$' },
        similarJobNames: ["DevOps Engineer", "Cloud Engineer", "Senior Backend Engineer"],
        topSkills: [
            { skillName: "AWS",           frequency: 86, importance: 'Required'    },
            { skillName: "Docker",        frequency: 88, importance: 'Required'    },
            { skillName: "CI/CD",         frequency: 92, importance: 'Required'    },
            { skillName: "GitHub Actions", frequency: 74, importance: 'Required'   },
            { skillName: "Cybersecurity", frequency: 58, importance: 'Preferred'   },
            { skillName: "Python",        frequency: 58, importance: 'Preferred'   },
            { skillName: "Google Cloud",  frequency: 54, importance: 'Preferred'   },
            { skillName: "Go",            frequency: 38, importance: 'Nice-to-Have'},
            { skillName: "Leadership",    frequency: 60, importance: 'Preferred'   },
            { skillName: "Problem Solving", frequency: 80, importance: 'Required' },
        ],
    },
    {
        title: "Cloud Engineer",
        normalizedTitle: "Cloud Engineer",
        industry: "Technology",
        seniorityLevel: "Mid-Level",
        demandMetrics: { demandScore: 74, monthlyGrowth: 3.7, competitionRatio: 3.0 },
        trendData:     { isGrowing: true, growthRate: 19.3 },
        salaryData:    { averageSalary: 152000, medianSalary: 145000, salaryRange: { min: 120000, max: 190000, p25: 132000, p75: 170000 }, currency: '$' },
        similarJobNames: ["DevOps Engineer", "Senior DevOps Engineer", "Backend Engineer"],
        topSkills: [
            { skillName: "AWS",           frequency: 86, importance: 'Required'    },
            { skillName: "Google Cloud",  frequency: 62, importance: 'Preferred'   },
            { skillName: "Docker",        frequency: 80, importance: 'Required'    },
            { skillName: "CI/CD",         frequency: 76, importance: 'Required'    },
            { skillName: "GitHub Actions", frequency: 64, importance: 'Preferred'  },
            { skillName: "Python",        frequency: 56, importance: 'Preferred'   },
            { skillName: "Cybersecurity", frequency: 50, importance: 'Preferred'   },
            { skillName: "Problem Solving", frequency: 74, importance: 'Required' },
        ],
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
        similarJobNames: ["Product Manager", "Frontend Engineer"],
        topSkills: [
            { skillName: "Figma",         frequency: 92, importance: 'Required'    },
            { skillName: "UI/UX Design",  frequency: 96, importance: 'Required'    },
            { skillName: "Communication", frequency: 80, importance: 'Required'    },
            { skillName: "Critical Thinking", frequency: 72, importance: 'Required' },
            { skillName: "Problem Solving", frequency: 78, importance: 'Required' },
            { skillName: "Teamwork",      frequency: 68, importance: 'Preferred'   },
            { skillName: "HTML",          frequency: 42, importance: 'Nice-to-Have'},
            { skillName: "CSS",           frequency: 38, importance: 'Nice-to-Have'},
        ],
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
        similarJobNames: ["Senior Product Manager", "UX Designer", "Marketing Manager"],
        topSkills: [
            { skillName: "Communication", frequency: 92, importance: 'Required'    },
            { skillName: "Leadership",    frequency: 86, importance: 'Required'    },
            { skillName: "Critical Thinking", frequency: 82, importance: 'Required' },
            { skillName: "Problem Solving", frequency: 88, importance: 'Required' },
            { skillName: "SQL",           frequency: 52, importance: 'Preferred'   },
            { skillName: "Figma",         frequency: 46, importance: 'Preferred'   },
            { skillName: "Teamwork",      frequency: 78, importance: 'Required'    },
            { skillName: "Data Science",  frequency: 36, importance: 'Nice-to-Have'},
        ],
    },
    {
        title: "Senior Product Manager",
        normalizedTitle: "Product Manager",
        industry: "Technology",
        seniorityLevel: "Senior",
        demandMetrics: { demandScore: 65, monthlyGrowth: 1.6, competitionRatio: 4.9 },
        trendData:     { isGrowing: true, growthRate: 7.8 },
        salaryData:    { averageSalary: 218000, medianSalary: 205000, salaryRange: { min: 172000, max: 290000, p25: 188000, p75: 255000 }, currency: '$' },
        similarJobNames: ["Product Manager", "Marketing Manager"],
        topSkills: [
            { skillName: "Communication", frequency: 92, importance: 'Required'    },
            { skillName: "Leadership",    frequency: 92, importance: 'Required'    },
            { skillName: "Critical Thinking", frequency: 86, importance: 'Required' },
            { skillName: "Problem Solving", frequency: 88, importance: 'Required' },
            { skillName: "SQL",           frequency: 56, importance: 'Preferred'   },
            { skillName: "Data Science",  frequency: 44, importance: 'Nice-to-Have'},
            { skillName: "Figma",         frequency: 48, importance: 'Preferred'   },
            { skillName: "Teamwork",      frequency: 76, importance: 'Required'    },
        ],
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
        similarJobNames: ["Investment Banker", "Accountant", "Data Analyst"],
        topSkills: [
            { skillName: "Excel",         frequency: 92, importance: 'Required'    },
            { skillName: "Financial Analysis", frequency: 96, importance: 'Required' },
            { skillName: "SQL",           frequency: 62, importance: 'Preferred'   },
            { skillName: "Accounting",    frequency: 58, importance: 'Preferred'   },
            { skillName: "Communication", frequency: 80, importance: 'Required'    },
            { skillName: "Critical Thinking", frequency: 76, importance: 'Required' },
            { skillName: "Problem Solving", frequency: 74, importance: 'Required' },
            { skillName: "Python",        frequency: 36, importance: 'Nice-to-Have'},
        ],
    },
    {
        title: "Investment Banker",
        normalizedTitle: "Investment Banker",
        industry: "Finance",
        seniorityLevel: "Mid-Level",
        demandMetrics: { demandScore: 48, monthlyGrowth: 0.4, competitionRatio: 11.2 },
        trendData:     { isGrowing: false, growthRate: 1.1 },
        salaryData:    { averageSalary: 175000, medianSalary: 158000, salaryRange: { min: 120000, max: 280000, p25: 138000, p75: 225000 }, currency: '$' },
        similarJobNames: ["Financial Analyst", "Accountant"],
        topSkills: [
            { skillName: "Financial Analysis", frequency: 96, importance: 'Required' },
            { skillName: "Excel",         frequency: 90, importance: 'Required'    },
            { skillName: "Accounting",    frequency: 72, importance: 'Required'    },
            { skillName: "Communication", frequency: 88, importance: 'Required'    },
            { skillName: "Leadership",    frequency: 74, importance: 'Preferred'   },
            { skillName: "Critical Thinking", frequency: 82, importance: 'Required' },
            { skillName: "Problem Solving", frequency: 80, importance: 'Required' },
            { skillName: "SQL",           frequency: 44, importance: 'Nice-to-Have'},
        ],
    },
    {
        title: "Accountant",
        normalizedTitle: "Accountant",
        industry: "Finance",
        seniorityLevel: "Entry",
        demandMetrics: { demandScore: 63, monthlyGrowth: 0.6, competitionRatio: 6.4 },
        trendData:     { isGrowing: false, growthRate: -0.8 },
        salaryData:    { averageSalary: 58000, medianSalary: 55000, salaryRange: { min: 42000, max: 74000, p25: 48000, p75: 66000 }, currency: '$' },
        similarJobNames: ["Financial Analyst", "Investment Banker"],
        topSkills: [
            { skillName: "Accounting",    frequency: 96, importance: 'Required'    },
            { skillName: "Excel",         frequency: 92, importance: 'Required'    },
            { skillName: "Financial Analysis", frequency: 74, importance: 'Required' },
            { skillName: "SQL",           frequency: 48, importance: 'Preferred'   },
            { skillName: "Communication", frequency: 76, importance: 'Required'    },
            { skillName: "Critical Thinking", frequency: 68, importance: 'Preferred' },
            { skillName: "Problem Solving", frequency: 72, importance: 'Preferred' },
        ],
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
        similarJobNames: ["Physician"],
        topSkills: [
            { skillName: "Electronic Health Records", frequency: 86, importance: 'Required' },
            { skillName: "HIPAA Compliance", frequency: 82, importance: 'Required' },
            { skillName: "Clinical Research", frequency: 52, importance: 'Preferred' },
            { skillName: "Communication", frequency: 92, importance: 'Required'    },
            { skillName: "Critical Thinking", frequency: 88, importance: 'Required' },
            { skillName: "Teamwork",      frequency: 86, importance: 'Required'    },
            { skillName: "Problem Solving", frequency: 84, importance: 'Required' },
            { skillName: "Leadership",    frequency: 48, importance: 'Nice-to-Have'},
        ],
    },
    {
        title: "Physician",
        normalizedTitle: "Physician",
        industry: "Healthcare",
        seniorityLevel: "Senior",
        demandMetrics: { demandScore: 76, monthlyGrowth: 1.8, competitionRatio: 1.2 },
        trendData:     { isGrowing: true, growthRate: 8.4 },
        salaryData:    { averageSalary: 248000, medianSalary: 235000, salaryRange: { min: 180000, max: 380000, p25: 205000, p75: 310000 }, currency: '$' },
        similarJobNames: ["Registered Nurse"],
        topSkills: [
            { skillName: "Electronic Health Records", frequency: 84, importance: 'Required' },
            { skillName: "HIPAA Compliance", frequency: 86, importance: 'Required' },
            { skillName: "Clinical Research", frequency: 72, importance: 'Required' },
            { skillName: "Communication", frequency: 92, importance: 'Required'    },
            { skillName: "Critical Thinking", frequency: 92, importance: 'Required' },
            { skillName: "Leadership",    frequency: 74, importance: 'Required'    },
            { skillName: "Problem Solving", frequency: 90, importance: 'Required' },
            { skillName: "Teamwork",      frequency: 80, importance: 'Required'    },
        ],
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
        similarJobNames: [],
        topSkills: [
            { skillName: "Communication", frequency: 96, importance: 'Required'    },
            { skillName: "Leadership",    frequency: 80, importance: 'Required'    },
            { skillName: "Critical Thinking", frequency: 84, importance: 'Required' },
            { skillName: "Problem Solving", frequency: 82, importance: 'Required' },
            { skillName: "Teamwork",      frequency: 76, importance: 'Required'    },
            { skillName: "Excel",         frequency: 44, importance: 'Nice-to-Have'},
        ],
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
        similarJobNames: ["Digital Marketing Specialist", "Product Manager"],
        topSkills: [
            { skillName: "Communication", frequency: 94, importance: 'Required'    },
            { skillName: "Leadership",    frequency: 82, importance: 'Required'    },
            { skillName: "Critical Thinking", frequency: 78, importance: 'Required' },
            { skillName: "Problem Solving", frequency: 76, importance: 'Required' },
            { skillName: "Excel",         frequency: 68, importance: 'Preferred'   },
            { skillName: "SQL",           frequency: 42, importance: 'Nice-to-Have'},
            { skillName: "Data Science",  frequency: 36, importance: 'Nice-to-Have'},
            { skillName: "Teamwork",      frequency: 80, importance: 'Required'    },
        ],
    },
    {
        title: "Digital Marketing Specialist",
        normalizedTitle: "Digital Marketing Specialist",
        industry: "Professional Services",
        seniorityLevel: "Entry",
        demandMetrics: { demandScore: 61, monthlyGrowth: 1.8, competitionRatio: 8.4 },
        trendData:     { isGrowing: true, growthRate: 9.2 },
        salaryData:    { averageSalary: 58000, medianSalary: 54000, salaryRange: { min: 40000, max: 76000, p25: 47000, p75: 67000 }, currency: '$' },
        similarJobNames: ["Marketing Manager"],
        topSkills: [
            { skillName: "Communication", frequency: 90, importance: 'Required'    },
            { skillName: "Excel",         frequency: 64, importance: 'Preferred'   },
            { skillName: "Critical Thinking", frequency: 72, importance: 'Required' },
            { skillName: "Problem Solving", frequency: 70, importance: 'Preferred' },
            { skillName: "Teamwork",      frequency: 74, importance: 'Required'    },
            { skillName: "SQL",           frequency: 36, importance: 'Nice-to-Have'},
        ],
    },
];

// ============================================
// UPSERT HELPERS
// ============================================

/**
 * Flattens a nested object into dot-notation keys for MongoDB $set.
 * Prevents accidentally overwriting entire subdocuments.
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
            update: { $setOnInsert: { name } } as any,
            upsert: true,
        },
    }));
    const result = await Industry.bulkWrite(ops, { ordered: false });
    console.log(`Industries     — upserted: ${result.upsertedCount}, matched (no-op): ${result.matchedCount}`);
};

const seedLocations = async () => {
    if (!LOCATION_SEED_DATA.length) return;
    const ops = LOCATION_SEED_DATA.map(({ name, baselineFactor, costOfLivingIndex, demandMetrics, salaryData }) => {
        const seedFields = flattenForSet({ baselineFactor, costOfLivingIndex, demandMetrics, salaryData });
        return {
            updateOne: {
                filter: { name },
                update: {
                    $set: seedFields,
                    $setOnInsert: { name, embedding: null, embeddingGeneratedAt: null },
                } as any,
                upsert: true,
            },
        };
    });
    const result = await Location.bulkWrite(ops, { ordered: false });
    console.log(`Locations      — upserted: ${result.upsertedCount}, updated: ${result.modifiedCount}`);
};

const seedSkills = async () => {
    if (!SKILL_SEED_DATA.length) return;
    const ops = SKILL_SEED_DATA.map(({ name, demandScore, growthRate, seniorityMultiplier, salaryData }) => ({
        updateOne: {
            filter: { name },
            update: {
                $set: { demandScore, growthRate, seniorityMultiplier, ...flattenForSet({ salaryData }) },
                $setOnInsert: { name, embedding: null, embeddingGeneratedAt: null },
            } as any,
            upsert: true,
        },
    }));
    const result = await Skill.bulkWrite(ops, { ordered: false });
    console.log(`Skills         — upserted: ${result.upsertedCount}, updated: ${result.modifiedCount}`);
};

const seedJobTitles = async (skillMap: Map<string, mongoose.Types.ObjectId>) => {
    if (!JOB_TITLE_SEED_DATA.length) return;

    // Warn about any unresolvable skillNames up front
    for (const jt of JOB_TITLE_SEED_DATA) {
        for (const ts of jt.topSkills ?? []) {
            if (!skillMap.has(ts.skillName)) {
                console.warn(`  [warn] Unknown skill "${ts.skillName}" in "${jt.title}" — will be skipped`);
            }
        }
    }

    const ops = JOB_TITLE_SEED_DATA.map(({ title, normalizedTitle, industry, seniorityLevel, demandMetrics, trendData, salaryData, topSkills }) => {
        const setFields: Record<string, any> = { normalizedTitle, industry, seniorityLevel };
        if (demandMetrics) Object.assign(setFields, flattenForSet({ demandMetrics }));
        if (trendData)     Object.assign(setFields, flattenForSet({ trendData }));
        if (salaryData)    Object.assign(setFields, flattenForSet({ salaryData }));
        if (topSkills && topSkills.length > 0) {
            setFields.topSkills = topSkills
                .filter(ts => skillMap.has(ts.skillName))
                .map(ts => ({
                    skill:      skillMap.get(ts.skillName),
                    skillName:  ts.skillName,
                    frequency:  ts.frequency,
                    importance: ts.importance,
                }));
        }
        return {
            updateOne: {
                filter: { title },
                update: {
                    $set: setFields,
                    $setOnInsert: { title, embedding: null, embeddingGeneratedAt: null, isActive: true },
                } as any,
                upsert: true,
            },
        };
    });

    const result = await JobTitle.bulkWrite(ops, { ordered: false });
    console.log(`Job Titles     — upserted: ${result.upsertedCount}, updated: ${result.modifiedCount}`);
};

// ============================================
// ENRICHMENT PASSES  (run after all docs exist)
// ============================================

/**
 * Writes similarSkills[] on every Skill.
 * Always overwrites — the SIMILAR_SKILL_SCORES table is the authoritative source.
 */
const enrichSimilarSkills = async (skillMap: Map<string, mongoose.Types.ObjectId>) => {
    const ops = SKILL_SEED_DATA
        .filter(s => s.similarSkillNames.length > 0)
        .map(({ name, similarSkillNames }) => {
            const similarSkills = similarSkillNames
                .filter(n => {
                    if (!skillMap.has(n)) {
                        console.warn(`  [warn] similarSkill "${n}" for "${name}" not in DB — skipping`);
                        return false;
                    }
                    return true;
                })
                .map(n => ({
                    skill:           skillMap.get(n),
                    skillName:       n,
                    similarityScore: getSkillSimilarityScore(name, n),
                }))
                .sort((a, b) => b.similarityScore - a.similarityScore);

            return {
                updateOne: {
                    filter: { name },
                    update: { $set: { similarSkills } } as any,
                },
            };
        });

    if (!ops.length) return;
    const result = await Skill.bulkWrite(ops, { ordered: false });
    console.log(`Skills (sims)  — updated: ${result.modifiedCount}`);
};

/**
 * Writes similarJobs[] on every JobTitle.
 * Always overwrites — the SIMILAR_JOB_SCORES table is the authoritative source.
 */
const enrichSimilarJobs = async (jobMap: Map<string, mongoose.Types.ObjectId>) => {
    const ops = JOB_TITLE_SEED_DATA
        .filter(jt => (jt.similarJobNames ?? []).length > 0)
        .map(({ title, similarJobNames }) => {
            const similarJobs = (similarJobNames ?? [])
                .filter(n => {
                    if (!jobMap.has(n)) {
                        console.warn(`  [warn] similarJob "${n}" for "${title}" not in DB — skipping`);
                        return false;
                    }
                    return true;
                })
                .map(n => ({
                    jobTitle:        jobMap.get(n),
                    titleName:       n,
                    similarityScore: getJobSimilarityScore(title, n),
                }))
                .sort((a, b) => b.similarityScore - a.similarityScore);

            return {
                updateOne: {
                    filter: { title },
                    update: { $set: { similarJobs } } as any,
                },
            };
        });

    if (!ops.length) return;
    const result = await JobTitle.bulkWrite(ops, { ordered: false });
    console.log(`Job Titles (sims) — updated: ${result.modifiedCount}`);
};

// ============================================
// MAIN
// ============================================

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log("Connected to MongoDB\n");

        // ── Phase 1: Core upserts ──────────────────────────────────────────
        console.log("Phase 1 — Core upserts");
        await seedIndustries();
        await seedLocations();
        await seedSkills();

        // Build skillMap once — reused by seedJobTitles + enrichSimilarSkills
        const skillDocs = await Skill.find({}, { _id: 1, name: 1 });
        const skillMap = new Map<string, mongoose.Types.ObjectId>(
            skillDocs.map(doc => [doc.name, doc._id])
        );

        await seedJobTitles(skillMap);

        // Build jobMap — needed for enrichSimilarJobs
        const jobDocs = await JobTitle.find({}, { _id: 1, title: 1 });
        const jobMap = new Map<string, mongoose.Types.ObjectId>(
            jobDocs.map(doc => [doc.title, doc._id])
        );

        // ── Phase 2: Relationship enrichment ──────────────────────────────
        console.log("\nPhase 2 — Relationship enrichment");
        await enrichSimilarSkills(skillMap);
        await enrichSimilarJobs(jobMap);

        console.log("\nDone.");
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
};

seed();