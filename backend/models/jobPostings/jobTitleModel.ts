import mongoose, { Document, Schema } from "mongoose";
import { INDUSTRY_NAMES } from "../../../shared/constants/jobsAndIndustries/constants";
import { JobTitle as JobTitleType } from "../../types/jobTitle.types";

// Define the schema (no changes to schema itself)
const jobTitleSchema = new Schema(
  {
    // Basic Information
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    
    normalizedTitle: { // e.g., "Software Engineer" for "Sr. Software Engineer", "Software Engineer II", etc.
      type: String,
      required: true,
      index: true,
    },
    similarJobs: [{
      jobTitle: { type: mongoose.Schema.Types.ObjectId, ref: 'JobTitle'},
      titleName: String,
      similarityScore: { type: Number, default: 0, min: 0, max: 1 },
    }],
    aliases: [ // e.g., ["Full Stack Developer", "Full-Stack Engineer"] for "Full Stack Engineer"
      {
        type: String,
        trim: true,
      },
    ],

    // Classification
    industry: {
      type: String,
      enum: INDUSTRY_NAMES,
      required: true,
      index: true,
    },

    seniorityLevel: {
      type: String,
      enum: ['Intern', 'Entry', 'Mid-Level', 'Senior'],
      required: true,
      index: true,
    },

    // Market Intelligence
    demandMetrics: {
      totalPostings: {
        type: Number,
        default: 0,
      },
      monthlyGrowth: {
        type: Number,
        default: 0,
      },
      demandScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      competitionRatio: {
        type: Number,
        default: 1,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },

    // Salary Intelligence
    salaryData: {
      averageSalary: {
        type: Number,
        default: 0,
      },
      medianSalary: {
        type: Number,
        default: 0,
      },
      salaryRange: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
        p25: { type: Number, default: 0 }, // 25th percentile
        p75: { type: Number, default: 0 }, // 75th percentile
      },
      bySeniority: {
        Intern: { avg: Number, median: Number },
        Entry: { avg: Number, median: Number },
        'Mid-Level': { avg: Number, median: Number },
        Senior: { avg: Number, median: Number },
      },
      currency: {
        type: String,
        default: '$',
        enum: ['$', '₱', '€', '¥', '£'],
      },
      lastCalculated: {
        type: Date,
        default: Date.now,
      },
    },

    // Skills Analytics
    topSkills: [
      {
        skill: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Skill',
        },
        skillName: String,
        frequency: {
          type: Number,
          min: 0,
          max: 100,
        },
        importance: {
          type: String,
          enum: ['required', 'preferred', 'nice-to-have'],
        },
      },
    ],

    // Industry Association
    commonIndustries: [
      {
        industry: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Industry',
        },
        industryName: String,
        percentage: Number, // % of jobs in this industry
      },
    ],

    // Education Requirements
    commonEducation: [
      {
        degree: {
          type: String,
          enum: ['High School', 'Associate', 'Bachelor', 'Master', 'PhD', 'None Required'],
        },
        percentage: Number, // % of jobs requiring this degree
      },
    ],

    // Experience Requirements
    experienceDistribution: {
      '0-2': { type: Number, default: 0 },
      '3-5': { type: Number, default: 0 },
      '6-10': { type: Number, default: 0 },
      '10+': { type: Number, default: 0 },
    },

    // Trend Analysis
    trendData: {
      isGrowing: {
        type: Boolean,
        default: false,
      },
      growthRate: {
        type: Number,
        default: 0, // % YoY growth
      },
    },

    embedding: {
        type: [Number],   // stored as flat float array
        default: null,
        select: false     // exclude from normal queries, only fetch when needed
    },

    // Metadata
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastAnalyzed: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes for performance
jobTitleSchema.index({ normalizedTitle: 1, seniorityLevel: 1 });
jobTitleSchema.index({ 'demandMetrics.demandScore': -1 });
jobTitleSchema.index({ 'salaryData.medianSalary': -1 });
jobTitleSchema.index({ 'trendData.growthRate': -1 });
jobTitleSchema.index({ seniorityLevel: 1 });

interface JobTitleDocument extends Document, JobTitleType {}

// Create and export the model
const JobTitle = mongoose.model<JobTitleDocument>('JobTitle', jobTitleSchema);
export default JobTitle;