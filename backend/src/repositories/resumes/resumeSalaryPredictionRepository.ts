import { Types }                from "mongoose";
import ResumeSalaryPrediction  from "../../models/resumes/resumeSalaryPredictionModel.js";
import logger                  from "../../utils/logger.js";


export const getResumeSalaryPredictionRepo = async (
    resumeId: string | Types.ObjectId,
) => {
    return ResumeSalaryPrediction
        .findOne({ resume: resumeId })
        .lean();
};


export const upsertResumeSalaryPredictionRepo = async (
    resumeId: string | Types.ObjectId,
    data: Partial<{
        predictedYearly:      number;
        predictedMonthly:     number;
        rangeMin:             number;
        rangeMax:             number;
        confidenceScore:      number;
        seniorityLevel:       string;
        totalExperienceYears: number | null;
        anchor:               Record<string, any>;
        location:             Record<string, any>;
        experience:           Record<string, any>;
        skillPremium:         Record<string, any>;
        calculatedAt:         Date;
        calculationVersion:   string;
    }>,
) => {
    const result = await ResumeSalaryPrediction.findOneAndUpdate(
        { resume: resumeId },
        { $set: { ...data, resume: resumeId } },
        { upsert: true, new: true },
    ).lean();

    logger.info(
        `[upsertResumeSalaryPredictionRepo] resumeId=${resumeId} ` +
        `predictedYearly=${data.predictedYearly} ` +
        `confidence=${data.confidenceScore}`,
    );

    return result;
};