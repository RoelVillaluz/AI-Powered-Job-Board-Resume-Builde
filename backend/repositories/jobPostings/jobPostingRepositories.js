import JobPosting from "../../models/jobPostings/jobPostingModel.js";
import Company from "../../models/companyModel.js"
import { buildJobQuery, buildIndustryMatch } from "../../../frontend/src/utils/jobPostings/filterJobUtils.js";
import { buildSortQuery } from "../../../frontend/src/utils/jobPostings/sortUtils.js";
import { buildCursorQuery } from "../../../frontend/src/utils/jobPostings/cursorUtils.js";

/**
 * Find job postings with cursor-based pagination and filters
 * CURSOR-BASED PAGINATION FOR OPTIMAL PERFORMANCE
 * @param {Object} options - Query options
 * @returns {Promise<{jobPostings: Array, nextCursor: string|null, hasMore: boolean}>}
 */
export const findJobsWithFilters = async (options) => {
    const {
        filters = {},
        cursor = null,
        limit = 20,
        excludeIds = [],
        sortBy = 'Best Match'
    } = options;

    // Build base query
    const baseQuery = buildJobQuery(filters);

    // Add exclude IDs to query
    if (excludeIds.length > 0) {
        baseQuery._id = { $nin: excludeIds };
    }

    // Build sort configuration
    const sortConfig = buildSortQuery(sortBy);
    const { sort, cursorFields } = sortConfig;

    // Add cursor query for pagination
    const cursorQuery = buildCursorQuery(cursor, sortConfig);
    if (cursorQuery) {
        // Merge cursor query with base query using $and
        const finalQuery = { $and: [baseQuery, cursorQuery] };
        Object.assign(baseQuery, finalQuery);
    }

    // OPTIMIZATION: If no industry filter, use simple query
    if (!filters.industry || filters.industry.length === 0) {
        // Fetch limit + 1 to check if there are more results
        const jobPostings = await JobPosting.find(baseQuery)
            .select('title location jobType experienceLevel preScreeningQuestions salary postedAt company skills')
            .populate('company', 'name logo industry')
            .sort(sort)
            .limit(limit + 1) // Fetch one extra
            .lean();

        // Check if there are more results
        const hasMore = jobPostings.length > limit;
        const results = hasMore ? jobPostings.slice(0, limit) : jobPostings;
        
        // Create next cursor from last item
        const nextCursor = hasMore && results.length > 0
            ? createCursor(results[results.length - 1], cursorFields)
            : null;

        return { 
            jobPostings: results, 
            nextCursor,
            hasMore 
        };
    }

    // COMPLEX QUERY: Use aggregation for industry filtering
    const industryMatch = buildIndustryMatch(filters.industry);

    const pipeline = [
        { $match: baseQuery },
        
        // Lookup company data
        {
            $lookup: {
                from: 'companies',
                localField: 'company',
                foreignField: '_id',
                as: 'company'
            }
        },
        { $unwind: '$company' },

        // Filter by industry
        ...(industryMatch ? [{ $match: industryMatch }] : []),

        // Project only needed fields
        {
            $project: {
                title: 1,
                location: 1,
                jobType: 1,
                experienceLevel: 1,
                salary: 1,
                postedAt: 1,
                skills: 1,
                'company._id': 1,
                'company.name': 1,
                'company.logo': 1,
                'company.industry': 1
            }
        },

        // Sort
        { $sort: sort },
        
        // Limit + 1 for hasMore check
        { $limit: limit + 1 }
    ];

    const jobPostings = await JobPosting.aggregate(pipeline);
    
    // Check if there are more results
    const hasMore = jobPostings.length > limit;
    const results = hasMore ? jobPostings.slice(0, limit) : jobPostings;
    
    // Create next cursor from last item
    const nextCursor = hasMore && results.length > 0
        ? createCursor(results[results.length - 1], cursorFields)
        : null;

    return {
        jobPostings: results,
        nextCursor,
        hasMore
    };
};

/**
 * Get total count for a given filter set
 * WARNING: countDocuments can be slow for complex queries
 * Only use when absolutely necessary (e.g., displaying "X total results")
 * @param {Object} filters - Filter parameters
 * @returns {Promise<number>}
 */
export const countJobsWithFilters = async (filters) => {
    const baseQuery = buildJobQuery(filters);
    
    // If no industry filter, simple count
    if (!filters.industry || filters.industry.length === 0) {
        return await JobPosting.countDocuments(baseQuery);
    }
    
    // With industry filter, use aggregation
    const industryMatch = buildIndustryMatch(filters.industry);
    
    const pipeline = [
        { $match: baseQuery },
        {
            $lookup: {
                from: 'companies',
                localField: 'company',
                foreignField: '_id',
                as: 'company'
            }
        },
        { $unwind: '$company' },
        ...(industryMatch ? [{ $match: industryMatch }] : []),
        { $count: 'total' }
    ];
    
    const result = await JobPosting.aggregate(pipeline);
    return result[0]?.total || 0;
};

/**
 * LEGACY: Simple pagination without filters (for backwards compatibility)
 * @deprecated Use findJobsWithFilters instead
 */
export const findJobsWithPagination = async ({ cursor, limit = 6, excludeIds = [] }) => {
    const query = {
        ...(cursor ? { postedAt: { $lt: new Date(cursor)} } : {}),
        ...(excludeIds.length > 0 ? { _id: { $nin: excludeIds } } : {})
    }

    const jobPostings = await JobPosting.find(query)
        .limit(limit)
        .populate('company', 'id name logo industry')
        .sort({ postedAt: -1, _id: -1 })
        .limit(limit + 1)
        .lean()

    const hasMore = jobPostings.length > limit;
    const items = hasMore ? jobPostings.slice(0, limit) : jobPostings;
    const nextCursor = hasMore ? items[items.length - 1].postedAt.toISOString() : null;

    return {
        jobPostings: items,
        hasMore,
        nextCursor
    }
}

/**
 * Find a job posting by ID with populated references
 * @param {string} id - Job posting ID
 * @returns {Promise<Object|null>}
 */
export const findJobById = async (id) => {
    return await JobPosting.findById(id)
        .populate('company', 'id name logo industry')
        .populate('applicants', 'profilePicture')
        .lean()    
}

/**
 * Create a new job posting
 * @param {Object} jobPostingData - Job posting data
 * @returns {Promise<Object>}
 */
export const createJob = async (jobPostingData) => {
    const newJob = new JobPosting(jobPostingData)
    return await newJob.save()
}

/**
 * Update a job posting by ID
 * @param {string} id - Job posting ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object|null>}
 */
export const updateJob = async (id, updateData) => {
    return await JobPosting.findByIdAndUpdate(
        id, updateData, 
        { new: true }
    ).lean();
}

/**
 * Delete a job posting by ID
 * @param {string} id - Job posting ID
 * @returns {Promise<Object|null>}
 */
export const deleteJob = async (id) => {
    return await JobPosting.findByIdAndDelete(id).lean();
}

/**
 * Add job posting to company's jobs list
 * @param {string} companyId - Company ID
 * @param {string} jobId - Job posting ID
 * @returns {Promise<Object|null>}
 */
export const addJobToCompany = async (companyId, jobId) => {
    return await Company.findByIdAndUpdate(
        companyId,
        { $push: { jobs: jobId } },
        { new: true }
    )
}

/**
 * Count total documents in collection
 * @returns {Promise<number>}
 */
export const count = async () => {
    return await JobPosting.countDocuments();
};