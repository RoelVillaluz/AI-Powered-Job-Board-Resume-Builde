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

const LOCATION_SEED_DATA = [
    // United States
    { name: "New York, NY" },
    { name: "San Francisco, CA" },
    { name: "Los Angeles, CA" },
    // Europe
    { name: "London, UK" },
    { name: "Paris, France" },
    // Asia Pacific
    { name: "Singapore" },
    { name: "Tokyo, Japan" },
    // Philippines
    { name: "Manila, Philippines" },
    { name: "Cebu, Philippines" },
    { name: "Legazpi, Philippines" },
    // Remote
    { name: "Remote" },
    { name: "Remote (US)" },
    { name: "Remote (Global)" },
];

// ============================================
// SKILL SEED DATA
// ============================================

const SKILL_SEED_DATA = [
    // Programming Languages
    { name: "Python" },
    { name: "JavaScript" },
    { name: "TypeScript" },
    { name: "Java" },
    { name: "C#" },
    { name: "C++" },
    { name: "Go" },
    { name: "Rust" },
    { name: "Ruby" },
    { name: "PHP" },
    { name: "Swift" },
    { name: "Kotlin" },
    { name: "Scala" },
    { name: "R" },
    // Frontend
    { name: "React" },
    { name: "Vue.js" },
    { name: "Angular" },
    { name: "Next.js" },
    { name: "HTML" },
    { name: "CSS" },
    { name: "Tailwind CSS" },
    // Backend
    { name: "Node.js" },
    { name: "Express.js" },
    { name: "Django" },
    { name: "GraphQL" },
    { name: "REST API" },
    // Databases
    { name: "PostgreSQL" },
    { name: "MySQL" },
    { name: "MongoDB" },
    { name: "Redis" },
    // Cloud & DevOps
    { name: "AWS" },
    { name: "Google Cloud" },
    { name: "Docker" },
    { name: "CI/CD" },
    { name: "GitHub Actions" },
    // AI & ML
    { name: "Machine Learning" },
    { name: "Deep Learning" },
    { name: "TensorFlow" },
    { name: "PyTorch" },
    { name: "Natural Language Processing" },
    { name: "Data Science" },
    { name: "pandas" },
    { name: "NumPy" },
    { name: "scikit-learn" },
    // Data & Analytics
    { name: "SQL" },
    // Security
    { name: "Cybersecurity" },
    // Mobile
    { name: "React Native" },
    { name: "Flutter" },
    // Design
    { name: "Figma" },
    { name: "UI/UX Design" },
    // Finance
    { name: "Financial Analysis" },
    { name: "Accounting" },
    { name: "Excel" },
    // Healthcare
    { name: "Electronic Health Records" },
    { name: "HIPAA Compliance" },
    { name: "Clinical Research" },
    // Soft Skills
    { name: "Communication" },
    { name: "Leadership" },
    { name: "Problem Solving" },
    { name: "Teamwork" },
    { name: "Critical Thinking" },
];

// ============================================
// JOB TITLE SEED DATA
// ============================================

const JOB_TITLE_SEED_DATA = [
    // Software Engineering
    { title: "Software Engineer",                normalizedTitle: "Software Engineer",            industry: "Technology",            seniorityLevel: "Mid-Level" },
    { title: "Junior Software Engineer",         normalizedTitle: "Software Engineer",            industry: "Technology",            seniorityLevel: "Entry"     },
    { title: "Senior Software Engineer",         normalizedTitle: "Software Engineer",            industry: "Technology",            seniorityLevel: "Senior"    },
    { title: "Software Engineering Intern",      normalizedTitle: "Software Engineer",            industry: "Technology",            seniorityLevel: "Intern"    },
    { title: "Frontend Engineer",                normalizedTitle: "Frontend Engineer",            industry: "Technology",            seniorityLevel: "Mid-Level" },
    { title: "Senior Frontend Engineer",         normalizedTitle: "Frontend Engineer",            industry: "Technology",            seniorityLevel: "Senior"    },
    { title: "Backend Engineer",                 normalizedTitle: "Backend Engineer",             industry: "Technology",            seniorityLevel: "Mid-Level" },
    { title: "Senior Backend Engineer",          normalizedTitle: "Backend Engineer",             industry: "Technology",            seniorityLevel: "Senior"    },
    { title: "Full Stack Engineer",              normalizedTitle: "Full Stack Engineer",          industry: "Technology",            seniorityLevel: "Mid-Level" },
    { title: "Senior Full Stack Engineer",       normalizedTitle: "Full Stack Engineer",          industry: "Technology",            seniorityLevel: "Senior"    },
    // Data
    { title: "Data Scientist",                   normalizedTitle: "Data Scientist",               industry: "Technology",            seniorityLevel: "Mid-Level" },
    { title: "Senior Data Scientist",            normalizedTitle: "Data Scientist",               industry: "Technology",            seniorityLevel: "Senior"    },
    { title: "Data Engineer",                    normalizedTitle: "Data Engineer",                industry: "Technology",            seniorityLevel: "Mid-Level" },
    { title: "Senior Data Engineer",             normalizedTitle: "Data Engineer",                industry: "Technology",            seniorityLevel: "Senior"    },
    { title: "Data Analyst",                     normalizedTitle: "Data Analyst",                 industry: "Technology",            seniorityLevel: "Entry"     },
    { title: "Senior Data Analyst",              normalizedTitle: "Data Analyst",                 industry: "Technology",            seniorityLevel: "Mid-Level" },
    { title: "Machine Learning Engineer",        normalizedTitle: "Machine Learning Engineer",    industry: "Technology",            seniorityLevel: "Mid-Level" },
    { title: "Senior Machine Learning Engineer", normalizedTitle: "Machine Learning Engineer",    industry: "Technology",            seniorityLevel: "Senior"    },
    // DevOps & Cloud
    { title: "DevOps Engineer",                  normalizedTitle: "DevOps Engineer",              industry: "Technology",            seniorityLevel: "Mid-Level" },
    { title: "Senior DevOps Engineer",           normalizedTitle: "DevOps Engineer",              industry: "Technology",            seniorityLevel: "Senior"    },
    { title: "Cloud Engineer",                   normalizedTitle: "Cloud Engineer",               industry: "Technology",            seniorityLevel: "Mid-Level" },
    // Design
    { title: "UX Designer",                      normalizedTitle: "UX Designer",                  industry: "Technology",            seniorityLevel: "Mid-Level" },
    // Product
    { title: "Product Manager",                  normalizedTitle: "Product Manager",              industry: "Technology",            seniorityLevel: "Mid-Level" },
    { title: "Senior Product Manager",           normalizedTitle: "Product Manager",              industry: "Technology",            seniorityLevel: "Senior"    },
    // Finance
    { title: "Financial Analyst",                normalizedTitle: "Financial Analyst",            industry: "Finance",               seniorityLevel: "Entry"     },
    { title: "Investment Banker",                normalizedTitle: "Investment Banker",            industry: "Finance",               seniorityLevel: "Mid-Level" },
    { title: "Accountant",                       normalizedTitle: "Accountant",                   industry: "Finance",               seniorityLevel: "Entry"     },
    // Healthcare
    { title: "Registered Nurse",                 normalizedTitle: "Registered Nurse",             industry: "Healthcare",            seniorityLevel: "Mid-Level" },
    { title: "Physician",                        normalizedTitle: "Physician",                    industry: "Healthcare",            seniorityLevel: "Senior"    },
    // Education
    { title: "Teacher",                          normalizedTitle: "Teacher",                      industry: "Education",             seniorityLevel: "Mid-Level" },
    // Marketing
    { title: "Marketing Manager",                normalizedTitle: "Marketing Manager",            industry: "Professional Services", seniorityLevel: "Mid-Level" },
    { title: "Digital Marketing Specialist",     normalizedTitle: "Digital Marketing Specialist", industry: "Professional Services", seniorityLevel: "Entry"     },
];

// ============================================
// SEEDING FUNCTIONS
// ============================================

const seedIndustries = async () => {
    const existing = await Industry.distinct('name') as string[];
    const existingSet = new Set(existing);
    
    const toInsert = INDUSTRY_SEED_DATA.filter(i => !existingSet.has(i.name));
    if (!toInsert.length) {
        console.log(`Industries — created: 0, skipped: ${existing.length}`);
        return;
    }

    await Industry.insertMany(toInsert, { ordered: false });
    console.log(`Industries — created: ${toInsert.length}, skipped: ${existingSet.size}`);
}

const seedLocations = async () => {
    const existing = await Location.distinct('name');
    const existingSet = new Set(existing);

    const toInsert = LOCATION_SEED_DATA.filter(l => !existingSet.has(l.name));
    if (!toInsert.length) {
        console.log(`Locations — created: 0, skipped: ${existing.length}`);
        return;
    }

    await Location.insertMany(toInsert, { ordered: false });
    console.log(`Locations — created: ${toInsert.length}, skipped: ${existingSet.size}`);
}

const seedSkills = async () => {
    const existing = await Skill.distinct('name');
    const existingSet = new Set(existing);

    const toInsert = SKILL_SEED_DATA.filter(s => !existingSet.has(s.name));
    if (!toInsert.length) {
        console.log(`Skills — created: 0, skipped: ${existing.length}`);
        return;
    }

    await Skill.insertMany(toInsert, { ordered: false });
    console.log(`Skills — created: ${toInsert.length}, skipped: ${existingSet.size}`);
}

const seedJobTitles = async () => {
    const existing = await JobTitle.distinct('title');
    const existingSet = new Set(existing);

    const toInsert = JOB_TITLE_SEED_DATA.filter(j => !existingSet.has(j.title));
    if (!toInsert.length) {
        console.log(`Job Titles — created: 0, skipped: ${existing.length}`);
        return;
    }

    await JobTitle.insertMany(toInsert, { ordered: false });
    console.log(`Job Titles — created: ${toInsert.length}, skipped: ${existingSet.size}`);
}

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
}

seed();