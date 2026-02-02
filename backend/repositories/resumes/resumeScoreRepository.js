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

export const upsertResumeScoreRepo = async (resumeId, updateData) => {
    // Make a shallow copy and remove 'resume' if present
    const { resume, ...dataToSet } = updateData;

    return await ResumeScore.findOneAndUpdate(
        { resume: resumeId },
        {
            $set: dataToSet,
            $setOnInsert: { resume: resumeId }
        },
        {
            new: true,
            upsert: true
        }
    );
};

