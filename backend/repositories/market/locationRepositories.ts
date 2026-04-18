// repositories/locationRepository.ts
import Location from "../../models/market/locationModel";
import { MarketEmbeddingUpdate } from "../../types/embeddings.types";
import { LocationInterface, CreateLocationPayload, UpdateLocationPayload } from "../../types/location.types";
import { Types } from "mongoose";

/**
 * Fetch a single location by ObjectId with all market fields.
 * Use for location detail pages or when a full document is needed.
 *
 * @param id - Location ObjectId
 */
export const getLocationByIdRepository = (id: Types.ObjectId) => {
    return Location.findById(id)
        .select('_id name costOfLivingIndex baselineFactor salaryData demandMetrics')
}

/**
 * Fetch a location by its exact name string.
 * Primary fallback when only a location string is available
 * from job postings or resume data.
 *
 * @param name - Location name e.g. "New York" or "Remote"
 */
export const getLocationByNameRepository = (name: string) => {
    return Location.findOne({ name })
        .select('_id name costOfLivingIndex baselineFactor salaryData demandMetrics')
}

/**
 * Search locations by partial name using case-insensitive regex.
 * Used for location autocomplete on job posting and profile forms.
 * Limited to 10 results to keep response size manageable.
 *
 * @param name - Partial location name string
 */
export const searchLocationsByNameRepository = (name: string) => {
    return Location.find({ name: { $regex: name, $options: 'i' } })
        .select('_id name baselineFactor')
        .limit(10)
}

/**
 * Fetch a location including its pre-computed embedding vector by ObjectId.
 * Embeddings are excluded from normal queries via select:false on the schema.
 * Use only when semantic similarity search between locations is needed.
 *
 * @param id - Location ObjectId
 */
export const getLocationEmbeddingByIdRepository = (id: Types.ObjectId) => {
    return Location.findById(id)
        .select('_id name embedding embeddingGeneratedAt')
}

/**
 * Fetch a location including its embedding by name string.
 * Fallback when only a name string is available.
 *
 * @param name - Location name string
 */
export const getLocationEmbeddingByNameRepository = (name: string) => {
    return Location.findOne({ name })
        .select('_id name embedding embeddingGeneratedAt')
}

/**
 * Create a new location document.
 * costOfLivingIndex and baselineFactor are optional at creation —
 * they can be set manually by admins or computed later by the pipeline.
 *
 * @param data - CreateLocationPayload containing name and optional factors
 */
export const createLocationRepository = (data: CreateLocationPayload) => {
    return Location.create(data)
}

/**
 * Update admin-editable fields of a location by ObjectId.
 * Returns the updated document.
 *
 * @param id - Location ObjectId
 * @param updateData - Partial user/admin-editable fields
 */
export const updateLocationRepository = (id: Types.ObjectId, updateData: UpdateLocationPayload) => {
    return Location.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
    )
}

/**
 * Write computed market metrics back to a location document.
 * Called by the aggregation pipeline worker on a schedule.
 * Accepts a partial LocationInterface to allow updating only changed fields.
 *
 * @param id - Location ObjectId
 * @param metrics - Computed market metrics to write back
 */
export const updateLocationMetricsRepository = (id: Types.ObjectId, metrics: Partial<LocationInterface>) => {
    return Location.findByIdAndUpdate(
        id,
        { $set: metrics },
        { new: true }
    )
}

/**
 * Write a pre-computed embedding vector back to a location document.
 * Called exclusively by the background embedding worker after encoding
 * the location name. Never called by user action.
 *
 * @param id - Location ObjectId
 * @param embedding - Flat float array from sentence-transformers
 */
export const updateLocationEmbeddingRepository = (
    id: Types.ObjectId | string,
    data: MarketEmbeddingUpdate
) => {
    return Location.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true }
    );
};

/**
 * Delete a location document by ObjectId.
 * Hard delete — location docs are market data, not user data.
 *
 * @param id - Location ObjectId
 */
export const deleteLocationRepository = (id: Types.ObjectId) => {
    return Location.findByIdAndDelete(id)
}