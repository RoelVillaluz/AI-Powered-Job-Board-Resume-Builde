// repositories/skillRepository.ts
import Skill from "../../models/market/skillModel";
import { SkillInterface, CreateSkillPayload, UpdateSkillPayload } from "../../types/skill.types";
import { Types } from "mongoose";

/**
 * Fetch a single skill by ObjectId with all market fields.
 * Use for skill detail pages or when a full document is needed.
 */
export const getSkillByIdRepository = (id: Types.ObjectId) => {
    return Skill.findById(id)
        .select('_id name demandScore growthRate seniorityMultiplier salaryData similarSkills lastUpdated')
}

/**
 * Fetch only the name of a skill by ObjectId.
 * Use when only the display name is needed — minimizes payload.
 */
export const getSkillNameRepository = (id: Types.ObjectId) => {
    return Skill.findById(id).select('_id name')
}

/**
 * Fetch core market metrics for a single skill by ObjectId.
 * Use for salary prediction and scoring pipelines.
 */
export const getSkillMetricsRepository = (id: Types.ObjectId) => {
    return Skill.findById(id)
        .select('_id name demandScore growthRate seniorityMultiplier salaryData')
}

/**
 * Fetch a skill including its pre-computed embedding vector by ObjectId.
 * Embeddings are excluded from normal queries via select:false on the schema.
 * Use only when semantic similarity search is needed.
 */
export const getSkillEmbeddingRepository = (id: Types.ObjectId) => {
    return Skill.findById(id).select('_id name embedding embeddingGeneratedAt')
}

/**
 * Search skills by name using a case-insensitive regex.
 * Used for autocomplete and skill search on the frontend.
 * Limited to 10 results to keep response size manageable.
 *
 * @param name - Partial or full skill name to search for
 */
export const getSkillsByNameRepository = (name: string) => {
    return Skill.find({ name: { $regex: name, $options: 'i' } })
        .select('_id name')
        .limit(10)
}

/**
 * Bulk fetch skills by an array of exact names.
 * Primary use case is resume/job matching — single DB round-trip for all skills.
 *
 * @param names - Array of exact skill name strings
 */
export const getSkillsByBulkNameRepository = (names: string[]) => {
    return Skill.find({ name: { $in: names } })
        .select('_id name demandScore growthRate seniorityMultiplier salaryData')
}

/**
 * Bulk fetch skills by an array of ObjectIds.
 * Use when skills are stored as ObjectId refs in job postings or resumes.
 *
 * @param ids - Array of skill ObjectIds
 */
export const getSkillsByBulkIdRepository = (ids: Types.ObjectId[]) => {
    return Skill.find({ _id: { $in: ids } })
        .select('_id name demandScore growthRate seniorityMultiplier salaryData')
}

/**
 * Create a new skill document.
 * Only accepts user-enterable fields — computed metrics are populated later
 * by the aggregation pipeline worker.
 *
 * @param data - CreateSkillPayload containing only the skill name
 */
export const createSkillRepository = (data: CreateSkillPayload) => {
    return Skill.create(data)
}

/**
 * Update user-editable fields of a skill by ObjectId.
 * Returns the updated document.
 *
 * @param id - Skill ObjectId
 * @param updateData - Partial user-editable fields
 */
export const updateSkillRepository = (id: Types.ObjectId, updateData: UpdateSkillPayload) => {
    return Skill.findByIdAndUpdate(id, { $set: updateData }, { new: true })
}

/**
 * Write a pre-computed embedding vector back to a skill document.
 * Called exclusively by the background embedding worker after encoding.
 * Separate from updateSkillRepository because embeddings are large and
 * written asynchronously — never by user action.
 *
 * @param id - Skill ObjectId
 * @param embedding - Flat float array from sentence-transformers
 */
export const updateSkillEmbeddingRepository = (id: Types.ObjectId, embedding: number[]) => {
    return Skill.findByIdAndUpdate(
        id,
        { $set: { embedding, embeddingGeneratedAt: new Date, lastUpdated: new Date() } },
        { new: true }
    )
}

/**
 * Write computed market metrics back to a skill document.
 * Called by the aggregation pipeline worker on a schedule.
 * Accepts a partial Skill to allow updating only changed fields.
 *
 * @param id - Skill ObjectId
 * @param metrics - Computed market metrics to write back
 */
export const updateSkillMetricsRepository = (id: Types.ObjectId, metrics: Partial<SkillInterface>) => {
    return Skill.findByIdAndUpdate(
        id,
        { $set: metrics },
        { new: true }
    )
}

/**
 * Write computed similar skills back to a skill document.
 * Called by the similarity worker after embeddings are computed
 * and cosine similarity is calculated across all skill pairs.
 *
 * @param id - Skill ObjectId
 * @param similarSkills - Ranked array of similar skills with scores
 */
export const updateSimilarSkillsRepository = (id: Types.ObjectId, similarSkills: SkillInterface['similarSkills']) => {
    return Skill.findByIdAndUpdate(
        id,
        { $set: { similarSkills } },
        { new: true }
    )
}

/**
 * Delete a skill document by ObjectId.
 * Hard delete — no soft delete since skills are market data, not user data.
 *
 * @param id - Skill ObjectId
 */
export const deleteSkillRepository = (id: Types.ObjectId) => {
    return Skill.findByIdAndDelete(id)
}