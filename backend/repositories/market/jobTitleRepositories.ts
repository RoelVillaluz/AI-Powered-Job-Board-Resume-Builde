// repositories/jobTitleRepository.ts
import JobTitle from "../../models/market/jobTitleModel";
import { JobTitleInterface, CreateJobTitlePayload, UpdateJobTitlePayload } from "../../types/jobTitle.types";
import { Types } from "mongoose";

/**
 * Fetch a single job title by ObjectId with all market fields.
 * Use for job title detail pages or full document access.
 */
export const getJobTitleByIdRepository = (id: Types.ObjectId) => {
    return JobTitle.findById(id)
        .select('_id title normalizedTitle seniorityLevel industry demandMetrics salaryData trendData topSkills commonEducation experienceDistribution similarJobs')
}

/**
 * Fetch a job title by its title/normalized title string.
 */
export const searchJobTitlesByNameRepository = (title: string) => {
    const normalizedTitle = title.toLowerCase().trim();  // Normalize the input

    return JobTitle.find({
        $or: [
            { title: { $regex: `${normalizedTitle}`, $options: 'i' } },
            { normalizedTitle: normalizedTitle }
        ]
    })
    .select('_id title normalizedTitle seniorityLevel industry topSkill similarJobs')
    .limit(10)
}

/**
 * Fetch a job title including its embedding by normalized title string.
 * Fallback when only a name string is available from job postings or free-text input.
 * Attempts exact match first, falls back to normalized lowercase.
 *
 * @param title - Job title string to search for
 */
export const getJobTitleEmbeddingByNameRepository = (title: string) => {
    return JobTitle.findOne({
        $or: [
            { title },
            { normalizedTitle: title.toLowerCase().trim() }
        ]
    }).select('_id title normalizedTitle embedding embeddingGeneratedAt')
}

/**
 * Fetch a job title including its pre-computed embedding vector by ObjectId.
 * Embeddings are excluded from normal queries via select:false on the schema.
 * Use only when semantic similarity search is needed.
 */
export const getJobTitleEmbeddingsByIdRepository = (id: Types.ObjectId) => {
    return JobTitle.findById(id)
        .select('_id title normalizedTitle embedding embeddingGeneratedAt')
}

/**
 * Fetch a job title including its embedding by normalized title string.
 * Fallback for free-text title input that needs semantic matching.
 *
 * @param normalizedTitle - Normalized title string
 */
export const getJobTitleEmbeddingsByNormalizedTitleRepository = (normalizedTitle: string) => {
    return JobTitle.findOne({ normalizedTitle })
        .select('_id title normalizedTitle embedding embeddingGeneratedAt')
}

/**
 * Fetch all active job titles for a given industry.
 * Used by the aggregation pipeline and industry analytics.
 *
 * @param industry - Industry name string from INDUSTRY_NAMES constants
 */
export const getJobTitlesByIndustryRepository = (industry: string) => {
    return JobTitle.find({
        'commonIndustries.industryName': industry,
    })
    .select('_id title normalizedTitle seniorityLevel demandMetrics salaryData')
}

export const getJobTitleMetricsByIdRepository = (id: Types.ObjectId) => {
    return JobTitle.find(id)
        .select('-embedding -embeddingGeneratedAt') // Include all fields except embedding fields
}

export const getJobTitleTopSkillsRepository = (id: Types.ObjectId) => {
    return JobTitle.find(id)
        .select('_id title topSkills')
}

/**
 * Create a new job title document.
 * Only user/admin-enterable fields — computed metrics populated by worker.
 */
export const createJobTitleRepository = (data: CreateJobTitlePayload) => {
    return JobTitle.create(data);
}

/**
 * Update user-editable fields of a job title by ObjectId.
 */
export const updateJobTitleRepository = (id: Types.ObjectId, updateData: UpdateJobTitlePayload) => {
    return JobTitle.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
    )
}

/**
 * Write a pre-computed embedding vector back to a job title document.
 * Called exclusively by the background embedding worker.
 * Uses normalizedTitle for encoding — more consistent across aliases.
 */
export const updateJobTitleEmbeddingRepository = (id: Types.ObjectId, embedding: number[]) => {
    return JobTitle.findByIdAndUpdate(
        id,
        { $set: { embedding, embeddingGeneratedAt: new Date, lastUpdated: new Date() } },
        { new: true }
    )
}

/**
 * Write computed market metrics back to a job title document.
 * Called by the aggregation pipeline worker on a schedule.
 */
export const updateJobTitleMetricsRepository = (id: Types.ObjectId, metrics: Partial<JobTitleInterface>) => {
    return JobTitle.findByIdAndUpdate(
        id,
        { $set: metrics },
        { new: true }
    )
}

/**
 * Write computed similar jobs back to a job title document.
 * Called by the similarity worker after cosine similarity is calculated.
 */
export const updateSimilarJobsRepository = (id: Types.ObjectId, similarJobs: JobTitleInterface['similarJobs']) => {
    return JobTitle.findByIdAndUpdate(
        id,
        { $set: { similarJobs } },
        { new: true }
    )
}


export const deleteJobTitleRepository = (id: Types.ObjectId) => {
    return JobTitle.findByIdAndDelete(id)
}