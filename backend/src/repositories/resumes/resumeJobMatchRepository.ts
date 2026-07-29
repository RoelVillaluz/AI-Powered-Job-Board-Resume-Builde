import { Types }      from "mongoose";
import ResumeJobMatch from "../../models/resumes/resumeJobMatchModel.js";
import logger         from "../../utils/logger.js";

/**
 * Fetch the latest match result for a resume.
 * Returns null if not found — caller decides whether to recompute.
 */
export const getMatchResultRepo = async (
    resumeId: string | Types.ObjectId,
) => {
    return ResumeJobMatch.findOne({ resume: resumeId }).lean();
};

/**
 * Fetch the top-ranked match for a resume (matches[0]).
 * Matches are sorted by finalScore desc in JobMatchingService
 * (ai-service/services/job_matching_service.py:64), so the first
 * entry is always the best fit. Returns null if no matches exist.
 */
export const getTopMatchRepo = async (
    resumeId: string | Types.ObjectId,
) => {
    const result = await ResumeJobMatch.findOne(
        { resume: resumeId },
        { matches: { $slice: 1 } }
    ).lean();
    return result?.matches?.[0] ?? null;
};

/**
 * Upsert match results for a resume.
 * Called by the matching pipeline after HybridScoringService returns ranked matches.
 * Replaces the entire matches array — always a fresh ranked list.
 */
export const upsertMatchResultRepo = async (
    resumeId: string | Types.ObjectId,
    payload:  Record<string, any>,
) => {
    const result = await ResumeJobMatch.findOneAndUpdate(
        { resume: resumeId },
        {
            $set: {
                matches:      payload.matches      ?? [],
                totalMatches: payload.matches?.length ?? 0,
                usedPinecone: payload.usedPinecone  ?? false,
                rankedAt:     payload.rankedAt      ?? new Date(),
            }
        },
        { upsert: true, new: true },
    );

    logger.info(
        `[MatchResultRepo] Upserted ${result.totalMatches} matches for resume: ${resumeId}`
    );
    return result;
};

/**
 * Delete match results for a resume.
 * Call when a resume is deleted or its embedding is invalidated.
 */
export const deleteMatchResultRepo = async (
    resumeId: string | Types.ObjectId,
) => {
    await ResumeJobMatch.deleteOne({ resume: resumeId });
    logger.info(`[MatchResultRepo] Deleted match result for resume: ${resumeId}`);
};

/**
 * Get a single job match entry from a resume's match list.
 * Used by the job details page to show match breakdown without recomputing.
 *
 * Replaces legacy ResumeJobComparison.findOne({ resume, jobPosting })
 */
export const getSingleJobMatchRepo = async (
    resumeId:     string | Types.ObjectId,
    jobPostingId: string | Types.ObjectId,
) => {
    const result = await ResumeJobMatch.findOne(
        { resume: resumeId },
        { matches: { $elemMatch: { jobId: jobPostingId } } }
    ).lean();

    return result?.matches?.[0] ?? null;
};

// ⚠️ ASSUMPTION: I don't have your existing resumeJobMatchRepository.ts, so
// I don't know what getMatchResultRepo already looks like — add this
// function alongside it rather than replacing the file.
export const setMatchExplanationRepo = async (
    resumeId: string | Types.ObjectId,
    jobId: string | Types.ObjectId,
    explanation: string,
) => {
    return ResumeJobMatch.findOneAndUpdate(
        { resume: resumeId, "matches.jobId": jobId },
        {
            $set: {
                "matches.$.explanation": explanation,
                "matches.$.explanationGeneratedAt": new Date(),
            },
        },
        { new: true },
    ).lean();
};