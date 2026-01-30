import ResumeScore from "../../models/resumes/resumeScoreModel.js"

export const getResumeScoreRepo = async (resumeId) => {
    return await ResumeScore.findOne({
        resume: resumeId
    })
    .select('-calculationVersion -predictedSalary')
}

export const getPredictedSalaryRepo = async (resumeId) => {
    return await ResumeScore.findOne({
        resume: resumeId
    })
    .select('resume predictedSalary')
}

export const createResumeScoreRepo = async (scoreData) => {
    const newScore = new ResumeScore(scoreData);
    return await newScore.save();
}

export const updateResumeScoreRepo = async (resumeId, updateData) => {
    const updatedScore = ResumeScore.findByIdAndUpdate(
        resumeId,
        updateData,
        { new: true }
    )

    return updatedScore
}