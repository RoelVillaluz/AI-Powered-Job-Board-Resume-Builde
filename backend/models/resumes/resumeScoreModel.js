import mongoose from "mongoose";

/**
 * ResumeScore Schema
 *
 * Stores AI-calculated metrics for a resume, including completeness, relevance,
 * overall score with letter grade, and actionable insights.
 *
 * Grade System:
 * - A+ (95-100): Exceptional resume
 * - A  (90-94):  Excellent resume
 * - B+ (85-89):  Very good resume
 * - B  (80-84):  Good resume
 * - C+ (75-79):  Above average resume
 * - C  (70-74):  Average resume
 * - D  (60-69):  Below average resume
 * - F  (0-59):   Needs significant improvement
 *
 * Example usage:
 * ```js
 * const score = new ResumeScore({
 *   resume: resume._id,
 *   completenessScore: 85,
 *   experienceScore: 80,
 *   skillsScore: 90,
 *   certificationScore: 75,
 *   totalScore: 84.5,
 *   grade: "B",
 *   estimatedExperienceYears: 3.5,
 *   strengths: ["Strong backend skills", "Comprehensive work history"],
 *   improvements: ["Add more certifications", "Include portfolio links"],
 *   recommendations: ["Learn AWS", "Get Docker certification"]
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
    
    // Score breakdown (all 0-100)
    completenessScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
        required: true
    },
    experienceScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
        required: true
    },
    skillsScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
        required: true
    },
    certificationScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
        required: true
    },
    
    // Overall weighted score
    totalScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
        required: true,
        index: true  // For sorting/filtering
    },
    
    // Letter grade (NEW FIELD)
    grade: {
        type: String,
        enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
        required: true,
        default: 'F',  // Default to 'F' if no grade is provided
        index: true  // For filtering by grade tier
    },

    overallMessage: {
        type: String,
        required: true,
        default: 'No message yet',
    },
    
    // Predicted metrics (optional, for future features)
    predictedSalary: {
        type: Number,
        default: null
    },
    estimatedExperienceYears: {
        type: Number,
        default: 0
    },
    
    // AI-generated insights
    strengths: {
        type: [String],
        default: []
    },
    improvements: {
        type: [String],
        default: []
    },
    recommendations: {
        type: [String],
        default: []
    },
    
    // Metadata
    calculatedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    calculationVersion: {
        type: String,
        default: '1.0'
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
resumeScoreSchema.index({ resume: 1, calculatedAt: -1 });

// Virtual property to check if score is fresh (< 7 days)
resumeScoreSchema.virtual('isFresh').get(function() {
    const daysSinceCalculation = (Date.now() - this.calculatedAt) / (1000 * 60 * 60 * 24);
    return daysSinceCalculation < 7;
});

// Instance method to get color for grade (for frontend)
resumeScoreSchema.methods.getGradeColor = function() {
    const colorMap = {
        'A+': '#10b981', // green-500
        'A':  '#22c55e', // green-400
        'B+': '#84cc16', // lime-500
        'B':  '#eab308', // yellow-500
        'C+': '#f97316', // orange-500
        'C':  '#f59e0b', // amber-500r
        'D':  '#ef4444', // red-500
        'F':  '#dc2626'  // red-600
    };
    return colorMap[this.grade] || '#6b7280'; // gray-500 default
};

// Static method to get grade from score
resumeScoreSchema.statics.calculateGrade = function(totalScore) {
    if (totalScore >= 95) return 'A+';
    if (totalScore >= 90) return 'A';
    if (totalScore >= 85) return 'B+';
    if (totalScore >= 80) return 'B';
    if (totalScore >= 75) return 'C+';
    if (totalScore >= 70) return 'C';
    if (totalScore >= 60) return 'D';
    return 'F';
};

const ResumeScore = mongoose.model('ResumeScore', resumeScoreSchema);
export default ResumeScore;