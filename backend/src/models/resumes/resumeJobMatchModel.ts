import mongoose from "mongoose";

/**
 * ResumeJobMatch Schema
 *
 * Combined schema replacing both the legacy ResumeJobComparison (1:1 manual comparison)
 * and the legacy job recommendation system (inline cosine similarity).
 *
 * Now stores a ranked list of top job matches for a resume, produced automatically
 * by the hybrid scoring pipeline:
 *   Pinecone retrieval → HybridScoringService → ranked matches stored here
 *
 * Key differences from legacy ResumeJobComparison:
 *   - 1 document per resume (not 1 per resume-job pair) — saves DB space
 *   - Triggered by embedding pipeline (not by user viewing a page)
 *   - Includes vector similarity, penalties, career fit — not just cosine scores
 *   - Metadata cached inline — job list page needs zero extra DB queries
 *
 * TTL: 1 day — job market changes daily, matches go stale quickly.
 */

const matchComponentsSchema = new mongoose.Schema({
    skillMatch:     { type: Number, min: 0, max: 100, default: 0 },
    experienceFit:  { type: Number, min: 0, max: 100, default: 0 },
    semanticSim:    { type: Number, min: 0, max: 100, default: 0 },
    seniorityFit:   { type: Number, min: 0, max: 100, default: 0 },
    locationFit:    { type: Number, min: 0, max: 100, default: 0 },
    certBonus:      { type: Number, min: 0, max: 100, default: 0 },
}, { _id: false });

const matchMetadataSchema = new mongoose.Schema({
    title:           { type: String, default: '' },
    location:        { type: String, default: '' },
    experienceLevel: { type: String, default: '' },
    jobType:         { type: String, default: '' },
    salaryMin:       { type: Number, default: 0   },
    salaryMax:       { type: Number, default: 0   },
    salaryCurrency:  { type: String, default: '$' },
    salaryFrequency: { type: String, default: 'year' },
}, { _id: false });

const jobMatchEntrySchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'JobPosting',
        required: true,
    },

    // ── Scores ────────────────────────────────────────────────────────────────
    finalScore:       { type: Number, min: 0, max: 100, default: 0 },
    vectorSimilarity: { type: Number, min: 0, max: 1,   default: 0 },

    // Replaces legacy: skillSimilarity, experienceSimilarity, requirementSimilarity
    components: { type: matchComponentsSchema, default: () => ({}) },

    // ── Classification ────────────────────────────────────────────────────────
    careerFit: {
        type: String,
        enum: ['Strong', 'Medium', 'Weak'],
        default: 'Weak',
    },
    recommendationType: {
        type: String,
        enum: ['Best Fit', 'Good Fit', 'Stretch', 'Poor Fit'],
        default: 'Poor Fit',
    },

    // ── Skill analysis ────────────────────────────────────────────────────────
    // Replaces legacy: matchedSkills, missingSkills
    matchedSkills:         { type: [String], default: [] },
    missingSkills:         { type: [String], default: [] },
    missingRequiredSkills: { type: [String], default: [] },

    // ── Insights ──────────────────────────────────────────────────────────────
    // Replaces legacy: strengths, improvements
    strengths:    { type: [String], default: [] },
    improvements: { type: [String], default: [] },

    // ── Explainability ────────────────────────────────────────────────────────
    penalties: { type: [String], default: [] },

    // ── Cached job fields ─────────────────────────────────────────────────────
    // Avoids extra DB lookup when rendering job list page
    metadata: { type: matchMetadataSchema, default: () => ({}) },

}, { _id: false });

const resumeJobMatchSchema = new mongoose.Schema({
    resume: {
        type:     mongoose.Schema.Types.ObjectId,
        ref:      'Resume',
        required: true,
        unique:   true,
        index:    true,
    },

    matches:      { type: [jobMatchEntrySchema], default: [] },
    totalMatches: { type: Number, default: 0 },
    usedPinecone: { type: Boolean, default: false },
    rankedAt:     { type: Date, default: Date.now, index: true },

}, { timestamps: true });

// TTL — auto-delete after 1 day
resumeJobMatchSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

const ResumeJobMatch = mongoose.model('ResumeJobMatch', resumeJobMatchSchema);
export default ResumeJobMatch;