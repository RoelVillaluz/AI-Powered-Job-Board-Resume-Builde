import ResumeEmbedding from "../../models/resumes/resumeEmbeddingsModel.js"

export const getAllResumeEmbeddingsRepo = async () => {
    return await ResumeEmbedding.find()
    .select('-model');
}

export const getResumeEmbeddingsRepo = async (resumeId) => {
    return await ResumeEmbedding.findOne({
        resume: resumeId
    })
    .select('-model');
}

export const createResumeEmbeddingRepo = async (embeddingData) => {
    const newEmbedding = new ResumeEmbedding(embeddingData);
    return await newEmbedding.save();
}

export const updateResumeEmbeddingRepo = async (resumeId, updateData) => {
    const updatedEmbeddings = await ResumeEmbedding.findByIdAndUpdate(
        resumeId,
        updateData,
        { new: true }
    )

    return updatedEmbeddings
}