import JobEmbedding from "../../models/jobPostings/jobPostingEmbeddingModel.js"

export const getJobEmbeddingRepo = async (jobId) => {
    return await JobEmbedding.findOne({
        jobPosting: jobId
    });
}

export const createJobEmbeddingRepo = async (embeddingData) => {
    const newEmbedding = new JobEmbedding(embeddingData);
    return await newEmbedding.save();
}

export const updateJobEmbeddingRepo = async (id, embeddingData) => {
    const updatedEmbeddings = await JobEmbedding.findByIdAndUpdate(
        id,
        embeddingData,
        { new: true }
    )

    return updatedEmbeddings
}

export const upsertJobEmbeddingRepo = async (
    jobPostingId,
    updateData
) => {
    const { jobPosting, _id, ...dataToSet } = updateData;

    return JobEmbedding.findOneAndUpdate(
        { jobPosting: jobPostingId },
        {
            $set: dataToSet,
            $setOnInsert: { jobPosting: jobPostingId }
        },
        {
            new: true,
            upsert: true
        }
    ).lean();
}