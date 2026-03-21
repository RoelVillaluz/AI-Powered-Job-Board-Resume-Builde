// repositories/industryRepository.ts
import Industry from "../../models/market/industryModel";
import { IndustryInterface, UpdateIndustryPayload } from "../../types/industry.types";
import { Types } from "mongoose";

/**
 * Fetch a single industry by ObjectId with all market fields.
 */
export const getIndustryByIdRepository = (id: Types.ObjectId) => {
    return Industry.findById(id)
        .select('_id name marketMetrics salaryBenchmarks topSkills topJobTitles emergingSkills decliningSkills')
}

/**
 * Fetch an industry by its exact name string.
 * Primary lookup method since job postings store industry as a string enum.
 *
 * @param name - Industry name from INDUSTRY_NAMES constants
 */
export const getIndustryByNameRepository = (name: string) => {
    return Industry.findOne({ name })
        .select('_id name marketMetrics salaryBenchmarks topSkills topJobTitles emergingSkills decliningSkills')
}

/**
 * Fetch an industry including its embedding vector by ObjectId.
 * Used for semantic similarity between industries.
 */
export const getIndustryEmbeddingByIdRepository = (id: Types.ObjectId) => {
    return Industry.findById(id)
        .select('_id name embedding marketMetrics salaryBenchmarks')
}

/**
 * Fetch an industry including its embedding by name string.
 * Fallback for when only a name string is available.
 */
export const getIndustryEmbeddingByNameRepository = (name: string) => {
    return Industry.findOne({ name })
        .select('_id name embedding marketMetrics salaryBenchmarks')
}

/**
 * Fetch all industries — used for seeding, admin dashboards, and dropdowns.
 * Returns only identity fields to keep payload small.
 */
export const getAllIndustriesRepository = () => {
    return Industry.find()
        .select('_id name')
}

/**
 * Update admin-editable fields of an industry.
 * Industry docs are seeded from constants — only description and aliases
 * are editable by admins. Metrics are written by the aggregation worker.
 */
export const updateIndustryRepository = (id: Types.ObjectId, updateData: UpdateIndustryPayload) => {
    return Industry.findByIdAndUpdate(id, { $set: updateData }, { new: true })
}

/**
 * Write computed market metrics back to an industry document.
 * Called by the aggregation pipeline worker on a schedule.
 */
export const updateIndustryMetricsRepository = (id: Types.ObjectId, metrics: Partial<IndustryInterface>) => {
    return Industry.findByIdAndUpdate(
        id,
        { $set: metrics },
        { new: true }
    )
}

/**
 * Write a pre-computed embedding vector back to an industry document.
 * Called exclusively by the background embedding worker.
 */
export const updateIndustryEmbeddingRepository = (id: Types.ObjectId, embedding: number[]) => {
    return Industry.findByIdAndUpdate(
        id,
        { $set: { embedding, lastAnalyzed: new Date() } },
        { new: true }
    )
}