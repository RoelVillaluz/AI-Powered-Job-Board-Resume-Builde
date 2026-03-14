import mongoose from "mongoose";
import { Skill as SkillType } from "../types/skill.types";

const skillSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    similarSkills: [{
        skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
        skillName: String ,
        similarityScore: { type: Number, default: 0, min: 0, max: 1 }
    }],

    // Core metrics
    demandScore: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        max: 100
    },
    
    growthRate: {
        type: Number,
        default: 0,
        min: -100,
        max: 100  // Percentage growth (e.g., 15 = 15% growth)
    },
    
    seniorityMultiplier: {
        type: Number,
        default: 1,
        min: 0.5,
        max: 3
    },
    
    // Salary data
    salaryData: {
        averageSalary: {
            type: Number,
            default: 0  // Store in base currency (e.g., USD)
        },
        medianSalary: {
            type: Number,
            default: 0
        },
        salaryRange: {
            min: { type: Number, default: 0 },
            max: { type: Number, default: 0 },
            p25: { type: Number, default: 0 }, // 25th percentile
            p75: { type: Number, default: 0 }, // 75th percentile
        },
        currency: {
            type: String,
            default: '$',
            enum: ['$', '₱', '€', '¥', '£'],
        },
        lastCalculated: {
            type: Date,
            default: Date.now
        }
    },

    embedding: {
        type: [Number],   // stored as flat float array
        default: null,
        select: false     // exclude from normal queries, only fetch when needed
    },
    
    // Metadata
    lastUpdated: {
        type: Date,
        default: Date.now
    },
}, {
    timestamps: true
});

// Indexes for performance
skillSchema.index({ type: 1 });
skillSchema.index({ demandScore: - 1 })
skillSchema.index({ growthRate: -1 });
skillSchema.index({ 'salaryData.averageSalary': -1 });

// Define the model using the Mongoose schema and the correct types
interface SkillDocument extends Document, SkillType {}

const Skill = mongoose.model<SkillDocument>('Skill', skillSchema)
export default Skill