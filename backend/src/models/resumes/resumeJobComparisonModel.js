import mongoose from "mongoose";


/**
 * ResumeJobComparison Schema
 *
 * Stores similarity and matching analysis between a specific resume and job posting.
 *
 * Fields include:
 * - skillSimilarity: cosine similarity between resume skills and job skills
 * - experienceSimilarity: similarity of work experience / job titles
 * - requirementSimilarity: similarity between certifications and job requirements
 * - strengths / improvements: AI insights on the match
 * - matchedSkills / missingSkills: specific skill-level matches
 *
 * Example usage:
 * ```js
 * const comparison = new ResumeJobComparison({
 *   resume: resume._id,
 *   jobPosting: job._id,
 *   skillSimilarity: 0.87,
 *   experienceSimilarity: 0.72,
 *   requirementSimilarity: 0.65,
 *   totalScore: 0.80,
 *   strengths: ["Relevant experience in backend development"],
 *   improvements: ["Add React experience"],
 *   matchedSkills: ["Node.js", "Express"],
 *   missingSkills: ["React"]
 * });
 * await comparison.save();
 * ```
 *
 * @schema ResumeJobComparison
 */
const resumeJobComparisonSchema = new mongoose.Schema({
    resume: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resume',
        required: true,
        index: true
    },
    jobPosting: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobPosting',
        required: true,
        index: true,
    },
    skillSimilarity: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    experienceSimilarity: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    requirementSimilarity: {
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
    // Analysis
    strengths: [String],
    improvements: [String],
    matchedSkills: [String],
    missingSkills: [String],

    // Cache metadata
    calculatedAt: {
        type: Date,
        default: Date.now,
        index: true
    }
    }, {
    timestamps: true
})

// Compound index for lookups
resumeJobComparisonSchema.index({ resume: 1, jobPosting: 1 }, { unique: true });

// TTL index - auto-delete after 30 days
resumeJobComparisonSchema.index({ createdAt: -1 }, { expireAfterSeconds: 2592000 });

const ResumeJobComparison = mongoose.model('ResumeJobComparison', resumeJobComparisonSchema);
export default ResumeJobComparison