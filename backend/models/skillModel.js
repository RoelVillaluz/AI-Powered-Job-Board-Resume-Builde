import mongoose from "mongoose";

const skillSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    type: {
        type: String,
        enum: ['technical', 'soft'],
        required: false
    },

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
    
    supplyScore: {
        type: Number,
        default: 50,
        min: 0,
        max: 100  // How many candidates have this skill
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
            max: { type: Number, default: 0 }
        },
        sampleSize: {
            type: Number,
            default: 0  // Number of data points used to calculate
        },
        lastCalculated: {
            type: Date,
            default: Date.now
        }
    },
    
    // Metadata
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    
    // Computed scores
    valueScore: {
        type: Number,
        default: 0
    },
    
    salaryScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100  // Normalized salary score relative to all skills
    }
}, {
    timestamps: true
});

// Indexes for performance
skillSchema.index({ valueScore: -1, demandScore: -1 });
skillSchema.index({ growthRate: -1 });
skillSchema.index({ 'salaryData.averageSalary': -1 });
skillSchema.index({ salaryScore: -1 });

const Skill = mongoose.model('Skill', skillSchema)
export default Skill