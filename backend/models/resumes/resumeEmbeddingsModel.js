import mongoose from "mongoose";

/**
 * ResumeEmbedding Schema
 *
 * Stores **precomputed vector embeddings** for a resume.
 * This avoids recalculating embeddings on every AI-related operation.
 *
 * - Raw embeddings are regenerated whenever the resume changes
 * - Mean embeddings are computed once and reused for similarity, scoring, and matching
 * - Includes `totalExperienceYears` as a numeric metric for experience-based scoring
 *
 * Example usage (maps directly to `extract_resume_embeddings` Python function):
 * ```python
 * mean_skill, mean_work, cert_embeddings, total_years = extract_resume_embeddings(resume)
 * ```
 * ```js
 * const newEmbedding = new ResumeEmbedding({
 *   resume: resume._id,
 *   embeddings: { skills, workExperience, certifications },
 *   meanEmbeddings: { skills: mean_skill, workExperience: mean_work, certifications: cert_embeddings },
 *   metrics: { totalExperienceYears: total_years },
 *   model: { name: "all-mpnet-base-v2", version: "1.0" }
 * });
 * await newEmbedding.save();
 * ```
 *
 * @schema ResumeEmbedding
 */
const resumeEmbeddingSchema = new mongoose.Schema({
    resume: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resume',
        required: true,
        unique: true,
        index: true
    },
    embeddings: {
        skills: {
            type: [[Number]],
            default: [],
        },
        workExperience: {
            type: [[Number]],
            default: [],
        },
        certifications: {
            type: [[Number]],
            default: [],
        },
    },
    meanEmbeddings: {
        skills: {
            type: [Number],
            default: null,
        },
        workExperience: {
            type: [Number],
            default: null,
        },
        certifications: {
            type: [Number],
            default: null,
        },
    },
    metrics: {
        totalExperienceYears: {
            type: Number,
            default: 0,
        },
    },
    // Metadata
    model: {
        name: {
            type: String,
            default: 'all-mpnet-base-v2'
        },
        version: {
            type: String,
            default: '1.0'
        }
    },
    generatedAt: {
        type: Date,
        default: Date.now
    }
    }, {
    timestamps: true
})

// TTL index - auto-delete old embeddings after 90 days
resumeEmbeddingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

const ResumeEmbedding = mongoose.model('ResumeEmbedding', resumeEmbeddingSchema);
export default ResumeEmbedding;