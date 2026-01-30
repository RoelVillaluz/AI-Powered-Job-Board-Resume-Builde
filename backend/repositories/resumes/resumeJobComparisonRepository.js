import ResumeJobComparison from "../../models/resumes/resumeJobComparisonModel.js"

export const getResumeJobComparisonRepo = async (resumeId, jobId) => {
    return await ResumeJobComparison.findOne({
        resume: resumeId,
        jobPosting: jobId
    })
}

export const createResumeJobComparisonRepo = async (comparisonData) => {
    const newComparison = new ResumeJobComparison(comparisonData);
    return await newComparison.save();
}