import { hasScoreableChange, hasSignificantChange, withTransaction } from "../../helpers/transactionHelpers.js";
import * as ResumeRepo from "../../repositories/resumes/resumeRepository.js";

/**
 * Find resumes based on query parameters.
 * 
 * Converts user-facing query params (e.g., URL search params) into
 * MongoDB filters, applies pagination and sorting, and returns
 * the results via the repository layer.
 *
 * @async
 * @function findResumesService
 * @param {Object} query - Query parameters from the request
 * @param {string} [query.skill] - Filter resumes containing this skill name
 * @param {string} [query.certification] - Filter resumes containing this certification name
 * @param {string} [query.userId] - Filter resumes created by this user
 * @param {number|string} [query.page=1] - Page number for pagination
 * @param {number|string} [query.limit=20] - Number of items per page
 * @param {Object} [query.sortBy={ createdAt: -1 }] - Sorting rules, e.g., { createdAt: -1 }
 * 
 * @returns {Promise<{data: Array<Object>, pagination: {page: number, limit: number, total: number, totalPages: number}}>}
 * An object containing the array of resumes and pagination info.
 *
 * @example
 * const query = {
 *   skill: "React",
 *   certification: "AWS Certified",
 *   page: 2,
 *   limit: 10
 * };
 * const result = await findResumesService(query);
 * console.log(result.data); // Array of matching resumes
 * console.log(result.pagination.totalPages); // Total pages
 */
export const findResumesService = async (query) => {
    const filters = {};

    if (query.skill) {
      filters.skills = { $elemMatch: { name: query.skill } };
    }

    if (query.certification) {
      filters.certifications = { $elemMatch: { name: query.certification } };
    }

    if (query.userId) {
      filters.user = query.userId;
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const sortBy = query.sortBy || { createdAt: -1 };

    return await ResumeRepo.findResumesRepo({ filters, sortBy, page, limit });
};

/**
 * Creates resume and initializes empty embeddings/scores within a transaction.
 * Background jobs will populate these later.
 * 
 * @async
 * @function createResumeService
 * @param {Object} resumeData - Resume data from request body
 * @returns {Promise<Object>} Created resume with related records
 * @throws {Error} If any database operation fails
 * 
 * Flow:
 * 1. Start transaction
 * 2. Create resume in DB
 * 3. Create empty embedding record (queued for background processing)
 * 4. Create empty score record (queued for background processing)
 * 5. Commit transaction
 * 6. Queue background jobs (outside transaction)
 * 7. Return resume immediately
 */
export const createResumeService = async (resumeData) => {
    return await withTransaction(async (session) => {
        // Step 1: Create the resume document
        const newResume = await ResumeRepo.createResumeRepo([resumeData], { session });

        // Step 2: Create empty embedding record (will be populated by background job)
        const newEmbedding = await ResumeRepo.createResumeEmbeddingRepo({ resume: newResume._id }, session)

        // Step 3: Create empty resume score document (will be populated later by background job)
        const newScore = await ResumeRepo.createResumeScoreRepo({ resume: newResume._id }, session)

        return {
            resume: newResume,
            embedding: newEmbedding,
            score: newScore
        }
    })
}

/**
 * Updates resume and invalidates related embeddings/scores within a transaction.
 * Background jobs will recalculate these.
 * 
 * @async
 * @function updateResumeService
 * @param {string} resumeId - Resume ObjectId
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Updated resume with invalidation status
 * @throws {Error} If resume not found or update fails
 */
export const updateResumeService = async (resumeId, updateData) => {
    return await withTransaction(async (session) => {
        // Update the resume document
        const updatedResume = await Resume.findByIdAndUpdate(
            resumeId,
            { 
                ...updateData,  // ✅ Spread the fields correctly
                updatedAt: new Date()
            },
            { 
                new: true,
                runValidators: true,
                session  // ✅ Include session
            }
        );

        if (!updatedResume) {
            throw new Error(`Resume not found with ID: ${resumeId}`);
        }

        // Determine what needs recalculation
        const needsEmbeddings = hasSignificantChange(updateData);
        const needsScoring = needsEmbeddings || hasScoreableChange(updateData);

        // Invalidate embeddings if needed
        if (needsEmbeddings) {
            await ResumeRepo.resetResumeEmbeddings(resumeId, session);  // ✅ Pass session
        }

        // Invalidate scores if needed
        if (needsScoring) {
            await ResumeRepo.resetResumeScore(resumeId, session);  // ✅ Pass session
        }

        // Invalidate any cached comparisons
        await ResumeRepo.deleteResumeComparisonResults(resumeId, session);  // ✅ Fixed variable name and pass session

        return {
            resume: updatedResume,
            invalidated: {
                embeddings: needsEmbeddings,
                scores: needsScoring,
                comparisons: true
            }
        };
    });
}

/**
 * Deletes resume and all related records (embeddings, scores, comparisons)
 * within a transaction to ensure data consistency.
 * 
 * @async
 * @function deleteResumeService
 * @param {string} resumeId - Resume ObjectId to delete
 * @returns {Promise<Object>} Deletion results
 * @throws {Error} If resume not found
 */
export const deleteResumeService = async (resumeId) => {
    return await withTransaction(async (session) => {
        const deletedResume = await ResumeRepo.deleteResumeRepo(resumeId);

        if (!deletedResume) {
            throw new Error(`Resume not found with ID: ${resumeId}`);
        }

        // Delete all related records
        const [deletedEmbedding, deletedScore, comparisonResult] = await Promise.all([
            ResumeRepo.deleteResumeEmbedding(resumeId, session),
            ResumeRepo.deleteResumeScore(resumeId, session),
            ResumeRepo.deleteResumeComparisonResults(resumeId, session)
        ])

        return {
            resume: deletedResume,
            deleted: {
                embedding: !!deletedEmbedding,
                score: !!deletedScore,
                comparisons: comparisonResult.deletedCount
            }
        }
    })
}