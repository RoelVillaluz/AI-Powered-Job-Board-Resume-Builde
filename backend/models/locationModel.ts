import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,   
        trim: true,     
        index: true     
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
    }

}, { timestamps: true })

locationSchema.index({ })