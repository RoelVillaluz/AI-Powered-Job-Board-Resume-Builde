import JobEmbedding from "../../models/jobPostings/jobPostingEmbeddingModel.js"

export const getJobEmbeddingRepo = async (jobId) => {
    return await JobEmbedding.findOne({
        job: jobId
    });
}

export const createJobEmbeddingRepo = async (embeddingData) => {
    const newEmbedding = new JobEmbedding(embeddingData);
    return await newEmbedding.save();
}