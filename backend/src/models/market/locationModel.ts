import mongoose from "mongoose";
import { HydratedDocument } from "mongoose";
import { LocationInterface } from "../../types/location.types.js";

export type LocationDocument = HydratedDocument<LocationInterface>

const locationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,   
        trim: true,     
    },
    
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

    baselineFactor: {
        type: Number,
        default: 0,   // deviation from global median e.g. +0.3 = 30% above median
        index: true
    },

    costOfLivingIndex: {
        type: Number,
        default: 100,   // add — 100 = baseline, used for salary normalization
    },

    demandMetrics: {
        totalPostings: { type: Number, default: 0 },
        growthRate: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now }
    },

    embedding: {
        type: [Number],
        default: null,
        select: false
    },

    embeddingGeneratedAt: {
        type: Date,
        default: null
    }

}, { timestamps: true })

// Name search
locationSchema.index({ name: 1 }, { unique: true });

// Salary metrics
locationSchema.index({ 'salaryData.averageSalary': -1 });
locationSchema.index({ 'salaryData.medianSalary': -1 });

// Baseline / cost-of-living
locationSchema.index({ baselineFactor: -1 });
locationSchema.index({ costOfLivingIndex: 1 });

// Demand metrics
locationSchema.index({ 'demandMetrics.totalPostings': -1 });
locationSchema.index({ 'demandMetrics.growthRate': -1 });

// Example compound index (optional)
locationSchema.index({ 'salaryData.averageSalary': -1, 'demandMetrics.totalPostings': -1 });

// Create and export the model
const Location = mongoose.model<LocationInterface>("Location", locationSchema);

export default Location