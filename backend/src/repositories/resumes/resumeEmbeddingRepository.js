import ResumeEmbedding from "../../models/resumes/resumeEmbeddingsModel.js"
import {
    RECONCILIATION_BATCH_SIZE,
    EXPECTED_EMBEDDING_DIMENSION,
    RESUME_EMBEDDING_TTL_DAYS,
    CURRENT_EMBEDDING_MODEL,
} from "../../infrastructure/reconciliation/constants/reconciliationConstants.js";
import Resume from "src/models/resumes/resumeModel.js";

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

/**
 * Find resumes that have no ResumeEmbedding document at all.
 * Fixed: foreignField is "resume" not "resumeId".
 */
export const findResumesWithoutEmbeddingsRepo = async (
    limit = RECONCILIATION_BATCH_SIZE,
) => {
    return Resume.aggregate([
        {
            $lookup: {
                from:         "resumeembeddings",
                localField:   "_id",
                foreignField: "resume",   // ← fixed
                as:           "embedding",
            },
        },
        { $match: { embedding: { $size: 0 } } },
        { $project: { _id: 1, user: 1 } },  // include user for enqueue
        { $limit: limit },
    ]);
};

/**
 * Find resumes whose embedding is stale or invalid.
 */
export const findResumesWithStaleEmbeddingsRepo = async (
    limit = RECONCILIATION_BATCH_SIZE,
) => {
    const ttlCutoff = new Date(
        Date.now() - RESUME_EMBEDDING_TTL_DAYS * 24 * 60 * 60 * 1000
    );

    return ResumeEmbedding.find({
        $or: [
            { generatedAt: { $lt: ttlCutoff } },
            { 'meanEmbeddings.skills': { $size: 0 } },
            { 'meanEmbeddings.skills': { $not: { $size: EXPECTED_EMBEDDING_DIMENSION } } },
        ],
    })
    .select('resume')
    .limit(limit)
    .lean();
};

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

export const upsertResumeEmbeddingRepo = async (
    resumeId,
    updateData
) => {
    const { resume, _id, ...dataToSet } = updateData;

    return ResumeEmbedding.findOneAndUpdate(
        { resume: resumeId },
        {
            $set: dataToSet,
            $setOnInsert: { resume: resumeId }
        },
        {
            new: true,
            upsert: true
        }
    ).lean();
};