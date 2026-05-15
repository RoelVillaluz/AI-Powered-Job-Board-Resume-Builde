import mongoose from "mongoose";

/**
 * ResumeSalaryPrediction Schema
 *
 * Stores the output of the salary prediction pipeline for a resume.
 * Produced by the Python salary_intelligence package via the
 * /compute/predict_salary endpoint.
 *
 * Step breakdown (anchor, location, experience, skillPremium) is stored
 * as raw JSON strings so the explanation layer and UI can surface the
 * full breakdown without re-running the pipeline. Parse with JSON.parse()
 * when needed on the client or service layer.
 *
 * Confidence score (0–100):
 *   Starts at the anchor level and is decremented by each step's
 *   penalty for missing data. Drives the salary band width:
 *     ≥ 90 → ± 5%    70–89 → ± 10%    50–69 → ± 15%    < 50 → ± 25%
 *
 * @schema ResumeSalaryPrediction
 */
const resumeSalaryPredictionSchema = new mongoose.Schema({
    resume: {
        type:     mongoose.Schema.Types.ObjectId,
        ref:      "Resume",
        required: true,
        unique:   true,
        index:    true,
    },

    // ── Point estimate ────────────────────────────────────────────────────
    predictedYearly:  { type: Number, default: 0, required: true },
    predictedMonthly: { type: Number, default: 0, required: true },

    // ── Confidence-driven salary band ─────────────────────────────────────
    rangeMin:        { type: Number, default: 0 },
    rangeMax:        { type: Number, default: 0 },
    confidenceScore: { type: Number, min: 0, max: 100, default: 0, index: true },

    // ── Candidate metadata ────────────────────────────────────────────────
    seniorityLevel: {
        type:    String,
        enum:    ["Intern", "Entry", "Mid-Level", "Senior"],
        default: null,
    },
    totalExperienceYears: { type: Number, default: null },

    // ── Pipeline step breakdown ───────────────────────────────────────────
    // Raw JSON strings — no sub-document overhead, no schema coupling.
    // Parse on the service/client layer when the explanation layer needs them.
    anchor:       { type: mongoose.Schema.Types.Mixed, default: null },
    location:     { type: mongoose.Schema.Types.Mixed, default: null },
    experience:   { type: mongoose.Schema.Types.Mixed, default: null },
    skillPremium: { type: mongoose.Schema.Types.Mixed, default: null },

    // ── Metadata ──────────────────────────────────────────────────────────
    calculatedAt:       { type: Date, default: Date.now, index: true },
    calculationVersion: { type: String, default: "1.0" },
}, {
    timestamps: true,
});

resumeSalaryPredictionSchema.index({ resume: 1, calculatedAt: -1 });

const ResumeSalaryPrediction = mongoose.model(
    "ResumeSalaryPrediction",
    resumeSalaryPredictionSchema,
);

export default ResumeSalaryPrediction;