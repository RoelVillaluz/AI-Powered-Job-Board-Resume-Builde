import mongoose from "mongoose";

/**
 * ResumeScore Schema
 *
 * Stores AI-calculated metrics for a resume, including completeness, relevance,
 * predicted salary, estimated experience, and suggestions for strengths or improvements.
 *
 * Example usage:
 * ```js
 * const score = new ResumeScore({
 *   resume: resume._id,
 *   completenessScore: 85,
 *   relevanceScore: 90,
 *   totalScore: 88,
 *   predictedSalary: 50000,
 *   estimatedExperienceYears: 3,
 *   strengths: ["Strong backend skills", "Clear formatting"],
 *   improvements: ["Not enough work experience compared to requirements (3+ years)"],
 *   recommendations: ["Consider including portfolio links"]
 * });
 * await score.save();
 * ```
 *
 * @schema ResumeScore
 */
const resumeScoreSchema = new mongoose.Schema({
    resume: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resume',
        required: true,
        unique: true,
        index: true
    },
    completenessScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    relevanceScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    totalScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    // Predicted metrics
    predictedSalary: {
        type: Number,
        default: 0
    },
    estimatedExperienceYears: {
        type: Number,
        default: 0
    },
    // AI Analysis results
    strengths: [String],
    improvements: [String],
    recommendations: [String],
    
    // Metadata
    calculatedAt: {
        type: Date,
        default: Date.now
    },
    calculationVersion: {
        type: String,
        default: '1.0'
    }
    }, {
    timestamps: true
});

// Auto-recalculate if older than 7 days
resumeScoreSchema.index({ calculatedAt: 1 });

const ResumeScore = mongoose.model('ResumeScore', resumeScoreSchema);
export default ResumeScore;