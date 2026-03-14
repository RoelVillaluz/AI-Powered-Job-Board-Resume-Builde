import mongoose, { HydratedDocument } from "mongoose";
import { SkillInterface } from "../types/skill.types";

export type SkillDocument = HydratedDocument<SkillInterface>;

const skillSchema = new mongoose.Schema<SkillInterface>({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    similarSkills: [{
        skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
        skillName: String,
        similarityScore: { type: Number, default: 0, min: 0, max: 1 }
    }],

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
        max: 100
    },

    seniorityMultiplier: {
        type: Number,
        default: 1,
        min: 0.5,
        max: 3
    },

    salaryData: {
        averageSalary: { type: Number, default: 0 },
        medianSalary: { type: Number, default: 0 },
        salaryRange: {
            min: { type: Number, default: 0 },
            max: { type: Number, default: 0 },
            p25: { type: Number, default: 0 },
            p75: { type: Number, default: 0 }
        },
        currency: {
            type: String,
            default: '$',
            enum: ['$', '₱', '€', '¥', '£']
        },
        lastCalculated: {
            type: Date,
            default: Date.now
        }
    },

    embedding: {
        type: [Number],
        default: null,
        select: false
    },

    lastUpdated: {
        type: Date,
        default: Date.now
    }

}, {
    timestamps: true
});

skillSchema.index({ demandScore: -1 });
skillSchema.index({ growthRate: -1 });
skillSchema.index({ 'salaryData.averageSalary': -1 });

const Skill = mongoose.model<SkillInterface>('Skill', skillSchema);

export default Skill;