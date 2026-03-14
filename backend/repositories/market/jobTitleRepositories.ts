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
 * Fetch a job title by its exact normalized title string.
 * Fallback when ObjectId ref is unavailable — e.g. legacy job postings or free-text input.
 *
 * @param normalizedTitle - Normalized title string e.g. "Software Engineer"
 */
export const getJobTitleByNormalizedTitleRepository = (normalizedTitle: string) => {
    return JobTitle.findOne({ normalizedTitle })
        .select('_id title normalizedTitle seniorityLevel industry demandMetrics salaryData trendData topSkills commonEducation experienceDistribution similarJobs isActive lastAnalyzed')
}

/**
 * Search job titles by partial name — case insensitive.
 * Used for autocomplete on job posting creation forms.
 * Limited to 10 results.
 *
 * @param title - Partial or full title string
 */
export const searchJobTitlesByTitleRepository = (title: string) => {
    return JobTitle.find({ title: { $regex: title, options: 'i' } })
        .select('_id title normalizedTitle industry')
}

/**
 * Fetch a job title including its pre-computed embedding vector by ObjectId.
 * Embeddings are excluded from normal queries via select:false on the schema.
 * Use only when semantic similarity search is needed.
 */
export const getJobTitleEmbeddingsRepositoryById = (id: Types.ObjectId) => {
    return JobTitle.findById(id)
        .select('_id title normalizedTitle embedding')
}

/**
 * Fetch a job title including its embedding by normalized title string.
 * Fallback for free-text title input that needs semantic matching.
 *
 * @param normalizedTitle - Normalized title string
 */
export const getJobTitleEmbeddingsByNormalizedTitleRepository = (normalizedTitle: string) => {
    return JobTitle.findOne({ normalizedTitle })
        .select('_id title normalizedTitle embedding')
}

/**
 * Fetch all active job titles for a given industry.
 * Used by the aggregation pipeline and industry analytics.
 *
 * @param industry - Industry name string from INDUSTRY_NAMES constants
 */
export const getJobTitlesByIndustryRepository = (industry: string) => {
    return JobTitle.find({ industry })
        .select('_id title normalizedTitle seniorityLevel demandMetrics salaryData')
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
        { $set: embedding },
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