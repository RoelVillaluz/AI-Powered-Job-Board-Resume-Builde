// repositories/jobTitleRepository.ts
import type { ImportanceLevel } from "../../../../shared/constants/jobsAndIndustries/constants.js";
import JobTitle from "../../models/market/jobTitleModel.js";
import { MarketEmbeddingUpdate } from "../../types/embeddings.types.js";
import { JobTitleInterface, CreateJobTitlePayload, UpdateJobTitlePayload } from "../../types/jobTitle.types.js";
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
    return JobTitle.findById(id)
        .select('-embedding -embeddingGeneratedAt') // Include all fields except embedding fields
}

/**
 * Fetches the top skills for a given job title, optionally filtered by importance level.
 *
 * Each returned skill contains:
 * - `_id`         → the actual Skill collection ID
 * - `skillName`   → the human-readable name of the skill
 * - `frequency`   → how common this skill is for the role
 * - `importance`  → importance level (e.g., 'required', 'preferred', 'nice-to-have')
 *
 * This function ensures that the frontend receives the correct skill `_id` from the skills collection,
 * rather than the internal `_id` of the topSkill document stored inside the JobTitle document.
 *
 * @async
 * @param {Types.ObjectId} id - The MongoDB ObjectId of the JobTitle document
 * @param {ImportanceLevel | null} normalizedImportance - Optional importance level to filter skills by;
 *                                                         if `null`, all topSkills are returned.
 * @returns {Promise<{
 *   _id: Types.ObjectId;
 *   title: string;
 *   topSkills: Array<{
 *     _id: Types.ObjectId;
 *     skillName: string;
 *     frequency: number;
 *     importance: string;
 *   }>;
 * } | undefined>} - The JobTitle with filtered and mapped topSkills; `undefined` if no matching job title.
 *
 * @example
 * const jobTitle = await getJobTitleTopSkillsByImportance(jobTitleId, 'required');
 * console.log(jobTitle.topSkills[0]._id); // actual Skill _id
 */
export const getJobTitleTopSkillsByImportance = async (
  id: Types.ObjectId,
  normalizedImportance: ImportanceLevel | null,
) => {
  // Only filter if importance is provided
  const matchImportance = normalizedImportance
    ? { $eq: [{ $toLower: '$$skill.importance' }, normalizedImportance] }
    : {};

  const result = await JobTitle.aggregate([
    { $match: { _id: id } },
    {
      $project: {
        _id: 1,
        title: 1,
        topSkills: {
            $map: {
                input: {
                $filter: {
                    input: '$topSkills',
                    as: 'skill',
                    cond: normalizedImportance ? matchImportance : { $literal: true }
                    }
                },
                as: 's',
                in: {
                    _id: '$$s.skill',        // <-- actual Skill ID
                    skillName: '$$s.skillName',
                    frequency: '$$s.frequency',
                    importance: '$$s.importance'
                }
            }
        }
      }
    }
  ]);

  return result[0];
};

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
export const updateJobTitleEmbeddingRepository = (
    id: Types.ObjectId | string,
    data: MarketEmbeddingUpdate
) => {
    return JobTitle.findByIdAndUpdate(
        id,
        { $set: { ...data, lastUpdated: new Date() } },
        { new: true }
    );
};

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