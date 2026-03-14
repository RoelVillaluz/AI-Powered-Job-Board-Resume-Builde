import mongoose, { Document } from "mongoose";
import { INDUSTRY_NAMES } from "../../shared/constants/jobsAndIndustries/constants";
import { Industry as IndustryType } from "../types/industry.types"; // Import the correct types

// Define the schema (no changes to schema itself)
const industrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: INDUSTRY_NAMES,
      unique: true,
      trim: true,
      index: true,
    },
    parentIndustry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Industry",
    },
    aliases: [
      {
        type: String,
        trim: true,
      },
    ],
    description: {
      type: String,
      trim: true,
    },
    marketMetrics: {
      totalCompanies: {
        type: Number,
        default: 0,
      },
      activeJobPostings: {
        type: Number,
        default: 0,
      },
      monthlyJobGrowth: {
        type: Number,
        default: 0,
      },
      competitionLevel: {
        type: String,
        enum: ["Very Low", "Low", "Medium", "High", "Very High"],
        default: "Medium",
      },
    },
    salaryBenchmarks: {
      overallMedian: {
        type: Number,
        default: 0,
      },
      byRole: [
        {
          jobTitle: String,
          median: Number,
          average: Number,
          sampleSize: Number,
        },
      ],
      bySeniority: {
        Intern: { avg: Number, median: Number },
        Entry: { avg: Number, median: Number },
        'Mid-Level': { avg: Number, median: Number },
        Senior: { avg: Number, median: Number },
      },
      salaryGrowthRate: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    topSkills: [
      {
        skill: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Skill",
        },
        skillName: String,
        demandPercentage: {
          type: Number,
          min: 0,
          max: 100,
        },
        averageSalaryPremium: {
          type: Number,
          default: 0,
        },
        growthRate: {
          type: Number,
          default: 0,
        },
      },
    ],
    topJobTitles: [
      {
        jobTitle: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "JobTitle",
        },
        titleName: String,
        postingCount: Number,
        percentage: Number,
        medianSalary: Number,
      },
    ],
    emergingSkills: [
      {
        skill: String,
        growthRate: Number,
        adoptionPercentage: Number,
      },
    ],
    decliningSkills: [
      {
        skill: String,
        declineRate: Number,
        currentPercentage: Number,
      },
    ],
    lastAnalyzed: {
      type: Date,
      default: Date.now,
      index: true,
    },
    dataQuality: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

// Add indexes
industrySchema.index({ name: 1 });
industrySchema.index({ "salaryBenchmarks.salaryGrowthRate": -1 });
industrySchema.index({ "marketMetrics.monthlyJobGrowth": -1 });

// Define the model using the Mongoose schema and the correct types
interface IndustryDocument extends Document, IndustryType {}

// Create and export the model
const Industry = mongoose.model<IndustryDocument>("Industry", industrySchema);

export default Industry;