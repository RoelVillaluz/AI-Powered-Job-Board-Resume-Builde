import JobPosting from "src/models/jobPostings/jobPostingModel.js";
import JobEmbedding from "../../models/jobPostings/jobPostingEmbeddingModel.js"
import { 
    JOB_EMBEDDING_TTL_DAYS, 
    RECONCILIATION_BATCH_SIZE, 
    EXPECTED_EMBEDDING_DIMENSION 
} from "../../infrastructure/reconciliation/constants/reconciliationConstants.js";

export const getJobEmbeddingRepo = async (jobId) => {
    return await JobEmbedding.findOne({
        jobPosting: jobId
    });
}

/**
 * Find active job postings that have no JobEmbedding document at all.
 * Fixed: foreignField is "jobPosting" not "jobPostingId".
 */
export const findJobsWithoutEmbeddingsRepo = async (
    limit = RECONCILIATION_BATCH_SIZE,
) => {
    return JobPosting.aggregate([
        { $match: { status: 'Active' } },  // only active jobs — don't waste compute on closed
        {
            $lookup: {
                from:         "jobpostingembeddings",
                localField:   "_id",
                foreignField: "jobPosting",   // ← fixed
                as:           "embedding",
            },
        },
        { $match: { embedding: { $size: 0 } } },
        { $project: { _id: 1 } },
        { $limit: limit },
    ]);
};

/**
 * Find job postings whose embedding is stale, invalid dimension, or wrong model.
 * These have an embedding document but it needs regenerating.
 */
export const findJobsWithStaleEmbeddingsRepo = async (
    limit = RECONCILIATION_BATCH_SIZE,
) => {
    const ttlCutoff = new Date(
        Date.now() - JOB_EMBEDDING_TTL_DAYS * 24 * 60 * 60 * 1000
    );

    return JobEmbedding.find({
        $or: [
            { generatedAt: { $lt: ttlCutoff } },
            { 'meanEmbeddings.skills': { $size: 0 } },
            { 'meanEmbeddings.skills': { $not: { $size: EXPECTED_EMBEDDING_DIMENSION } } },
        ],
    })
    .select('jobPosting')
    .limit(limit)
    .lean();
};

/**
 * Find job postings that have a valid embedding in MongoDB
 * but no corresponding vector in Pinecone.
 * Used by Pinecone gap-fill reconciliation.
 */
export const findJobsWithMissingPineconeVectorRepo = async (
    existingPineconeIds,
    limit = RECONCILIATION_BATCH_SIZE,
) => {
    const allEmbeddings = await JobEmbedding
        .find({}, { jobPosting: 1 })
        .limit(limit * 2)  // fetch extra since we'll filter
        .lean();

    return allEmbeddings
        .filter(e => !existingPineconeIds.has(e.jobPosting.toString()))
        .slice(0, limit);
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
