import { Types } from "mongoose";
import Resume         from "../../models/resumes/resumeModel.js";
import ResumeJobMatch  from "../../models/resumes/resumeJobMatchModel.js";
import logger           from "../../utils/logger.js";

export interface MatchInsightPayload {
    resume: {
        skills: { name: string }[];
        experienceLevel: string;
    };
    matches: any[]; // single-entry array, matches build_match_context's expected shape
}

export const buildMatchInsightPayload = async (
    resumeId: string | Types.ObjectId,
    jobId: string | Types.ObjectId,
): Promise<MatchInsightPayload | null> => {

    const [resume, matchDoc] = await Promise.all([
        Resume.findById(resumeId).lean(),
        ResumeJobMatch.findOne(
            { resume: resumeId, "matches.jobId": jobId },
            { "matches.$": 1 }, // only the one matching array element
        ).lean(),
    ]);

    if (!resume) {
        logger.error(`[buildMatchInsightPayload] Resume not found: ${resumeId}`);
        return null;
    }

    const targetMatch = (matchDoc as any)?.matches?.[0];
    if (!targetMatch) {
        logger.warn(`[buildMatchInsightPayload] No match found for resume ${resumeId} / job ${jobId}`);
        return null;
    }

    return {
        resume: {
            skills:          (resume as any).skills ?? [],
            experienceLevel: (resume as any).experienceLevel ?? "",
        },
        matches: [targetMatch],
    };
};