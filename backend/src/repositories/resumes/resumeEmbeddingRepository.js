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

export const createResumeEmbeddingRepo = async (data, { session } = {}) => {
    const embedding = new ResumeEmbedding(data);
    return await embedding.save({ session });
};

export const updateResumeEmbeddingRepo = async (resumeId, updateData) => {
    const updatedEmbeddings = await ResumeEmbedding.findByIdAndUpdate(
        resumeId,
        updateData,
        { new: true }
    )

    return updatedEmbeddings
}