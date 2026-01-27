import ResumeEmbedding from "../../models/resumes/resumeEmbeddingsModel.js";
import Resume from "../../models/resumes/resumeModel.js";
import ResumeScore from "../../models/resumes/resumeScoreModel.js";
import ResumeJobComparison from "../../models/resumes/resumeJobComparisonModel.js";

/**
 * Find resumes with optional filters, sorting, and pagination.
 *
 * @async
 * @function findResumesRepo
 * @param {Object} options
 * @param {Object} [options.filters={}] - MongoDB query filters
 * @param {Object} [options.sortBy={}] - MongoDB sort object, e.g., { createdAt: -1 }
 * @param {number} [options.page=1] - Page number for pagination
 * @param {number} [options.limit=20] - Number of items per page
 * @returns {Promise<{data: Array, pagination: {page: number, limit: number, total: number, totalPages: number}}>}
 *
 * @example
 * const result = await findResumesRepo({
 *   filters: { skills: { $elemMatch: { name: "React" } } },
 *   sortBy: { createdAt: -1 },
 *   page: 2,
 *   limit: 10
 * });
 */
export const findResumesRepo = async ({ filters = {}, sortBy = {}, page = 1, limit = 20 } = {}) => {
    const skip = (page - 1) * limit;

    const [resumes, total] = await Promise.all([
        Resume.find(filters)
            .populate('user', '_id')
            .sort(sortBy)
            .skip(skip)
            .limit(limit)
            .lean(),
        Resume.countDocuments(filters)
    ]);

    return {
        data: resumes,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

/**
 * Find a single resume by its ID.
 *
 * @async
 * @function findResumeByIdRepo
 * @param {string} id - Resume MongoDB ObjectId
 * @returns {Promise<Object|null>} The found resume or null if not found
 *
 * @example
 * const resume = await findResumeByIdRepo("64f1a5d2a3c4b0e123456789");
 */
export const findResumeByIdRepo = async (id) => {
    return await Resume.findById(id)
        .populate('user', '_id')
        .lean();
};

/**
 * Find list of resumes by user ID
 * 
 * @async
 * @function findResumesByUserRepo
 * @param {string} userId - User MongoDB ObjectId
 * @returns {Promise<Array<Object>>} An array of resume objects (empty if none found)
 * 
 * @example
 * const resumes = await findResumesByUserRepo("64f1a5d2a3c4b0e123456789");
 * console.log(resumes.length); // 0 if no resumes
 */
export const findResumesByUserRepo = async (userId) => {
    return await Resume.find({ user: userId })
        .populate('user', '_id')
        .lean()
}

/**
 * Create a new resume.
 *
 * @async
 * @function createResumeRepo
 * @param {Object} resumeData - Resume data object
 * @returns {Promise<Object>} The created resume
 *
 * @example
 * const newResume = await createResumeRepo({ firstName: "John", lastName: "Doe", skills: [...] });
 */
export const createResumeRepo = async (resumeData) => {
    const newResume = new Resume(resumeData);
    return await newResume.save();
};

/**
 * Creates resume embedding object for reusable fast calculations
 * 
 * @async
 * @function createResumeEmbeddingRepo
 * @param {Object} data - Embedding data
 * @param {string} data.resume - Resume MongoDB ObjectId reference
 * @param {Object} [session] - Mongoose session for transactions
 * @returns {Promise<Object>} created embedding object with default values
 * 
 * @example
 * const newEmbedding = await createResumeEmbeddingRepo({ 
 *   resume: "64f1a5d2a3c4b0e123456789", 
 *   meanEmbeddings: { 
 *     skills: [-0.121, 0.338, 0.427], 
 *     workExperience: [0.221, 0.045, -0.678], 
 *     certifications: [-0.118, 0.764, 0.309], 
 *   }
 * });
 */
export const createResumeEmbeddingRepo = async (data, session = null) => {
    const options = session ? { session } : {};
    const newEmbedding = new ResumeEmbedding(data);
    return await newEmbedding.save(options);
}

/**
 * Creates object for storing AI-calculated metrics
 * 
 * @async
 * @function createResumeScoreRepo
 * @param {Object} data - Score data
 * @param {string} data.resume - Resume MongoDB ObjectId reference
 * @param {Object} [session] - Mongoose session for transactions
 * @returns {Promise<Object>} created score object
 * 
 * @example
 * const newScore = await createResumeScoreRepo({ 
 *   resume: "64f1a5d2a3c4b0e123456789", 
 *   completenessScore: 75, 
 *   relevanceScore: 80, 
 *   totalScore: 75, 
 *   predictedSalary: 100000 
 * });
 */
export const createResumeScoreRepo = async (data, session = null) => {
    const options = session ? { session } : {};
    const newScore = new ResumeScore(data);
    return await newScore.save(options);
}

/**
 * Update a resume by ID and reset score/predictedSalary.
 *
 * @async
 * @function updateResumeRepo
 * @param {string} id - Resume MongoDB ObjectId
 * @param {Object} updateData - Fields to update
 * @param {mongoose.ClientSession} [session] - Optional Mongoose session for transactions
 * @returns {Promise<Object|null>} The updated resume or null if not found
 *
 * @example
 * const updated = await updateResumeRepo("64f1a5d2a3c4b0e123456789", { firstName: "Jane" });
 */
export const updateResumeRepo = async (id, updateData, session) => {
    const updatedResume = await Resume.findByIdAndUpdate(
        id,
        {
            ...updateData,
            score: 0,
            predictedSalary: 0
        },
        {
            new: true,
            session
        }
    ).lean();

    return updatedResume;
};

/**
 * Delete a resume by ID.
 *
 * @async
 * @function deleteResumeRepo
 * @param {string} id - Resume MongoDB ObjectId
 * @returns {Promise<Object|null>} The deleted resume or null if not found
 *
 * @example
 * const deleted = await deleteResumeRepo("64f1a5d2a3c4b0e123456789");
 */
export const deleteResumeRepo = async (id) => {
    return await Resume.findByIdAndDelete(id);
};

/**
 * Reset score and predictedSalary fields for a resume.
 *
 * @async
 * @function resetResumeScoreAndPredictedSalaryRepo
 * @param {string} id - Resume MongoDB ObjectId
 * @param {mongoose.ClientSession} [session] - Optional Mongoose session for transactions
 * @returns {Promise<Object|null>} Updated resume
 *
 * @example
 * const resetResume = await resetResumeScoreAndPredictedSalaryRepo("64f1a5d2a3c4b0e123456789");
 */
export const resetResumeScoreAndPredictedSalaryRepo = async (id, session) => {
    return await Resume.findByIdAndUpdate(
        id,
        { score: 0, predictedSalary: 0 },
        { new: true, session }
    ).lean();
};

/**
 * Resets resume embeddings to empty state (queued for background recalculation)
 * 
 * @async
 * @function resetResumeEmbeddings
 * @param {string} resumeId - Resume MongoDB ObjectId
 * @param {Object} [session] - Mongoose session for transactions
 * @returns {Promise<Object|null>} Updated embedding document or null if not found
 */
export const resetResumeEmbeddings = async (resumeId, session = null) => {
    const options = session ? { session, new: true } : { new: true };
    
    return await ResumeEmbedding.findOneAndUpdate(
        { resume: resumeId },  // ✅ Find by resume reference
        { 
            $set: { 
                embeddings: { 
                    skills: [], 
                    workExperience: [], 
                    certifications: [] 
                },
                meanEmbeddings: { 
                    skills: [], 
                    workExperience: null, 
                    certifications: null 
                },
                metrics: { 
                    totalExperienceYears: 0  // ✅ Fixed typo
                },
                generatedAt: new Date()
            }
        },
        options
    );
}

/**
 * Resets resume scores to zero (queued for background recalculation)
 * 
 * @async
 * @function resetResumeScore
 * @param {string} resumeId - Resume MongoDB ObjectId
 * @param {Object} [session] - Mongoose session for transactions
 * @returns {Promise<Object|null>} Updated score document or null if not found
 */
export const resetResumeScore = async (resumeId, session = null) => {
    const options = session ? { session, new: true } : { new: true };
    
    return await ResumeScore.findOneAndUpdate(
        { resume: resumeId },  // ✅ Find by resume reference
        {
            $set: {
                completenessScore: 0,
                relevanceScore: 0,
                totalScore: 0,
                predictedSalary: 0,
                estimatedExperienceYears: 0,
                strengths: [],
                improvements: [],
                recommendations: [],
                calculatedAt: new Date()
            }
        },
        options
    );
}

/**
 * Deletes resume embedding document completely
 * 
 * @async
 * @function deleteResumeEmbedding
 * @param {string} resumeId - Resume MongoDB ObjectId
 * @param {Object} [session] - Mongoose session for transactions
 * @returns {Promise<Object|null>} Deleted embedding document
 */
export const deleteResumeEmbedding = async (resumeId, session = null) => {
    const options = session ? { session } : {};
    return await ResumeEmbedding.findOneAndDelete(
        { resume: resumeId },
        options
    );
}

/**
 * Deletes resume score document completely
 * 
 * @async
 * @function deleteResumeScore
 * @param {string} resumeId - Resume MongoDB ObjectId
 * @param {Object} [session] - Mongoose session for transactions
 * @returns {Promise<Object|null>} Deleted score document
 */
export const deleteResumeScore = async (resumeId, session = null) => {
    const options = session ? { session } : {};
    return await ResumeScore.findOneAndDelete(
        { resume: resumeId },
        options
    );
}

/**
 * Deletes all job comparison results for a resume
 * 
 * @async
 * @function deleteResumeComparisonResults
 * @param {string} resumeId - Resume MongoDB ObjectId
 * @param {Object} [session] - Mongoose session for transactions
 * @returns {Promise<Object>} Delete operation result
 */
export const deleteResumeComparisonResults = async (resumeId, session = null) => {
    const options = session ? { session } : {};
    return await ResumeJobComparison.deleteMany(
        { resume: resumeId },
        options
    );
}