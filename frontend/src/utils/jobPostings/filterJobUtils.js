/**
 * Build MongoDB query object from filter parameters
 * @param {Object} filters - Filter parameters from request
 * @returns {Object} MongoDB query object
 */
export const buildJobQuery = (filters) => {
    const query = {};

    // Salary range filter
    if (filters.minSalary || filters.maxSalary) {
        query['salary.amount'] = {};
        if (filters.minSalary) query['salary.amount'].$gte = Number(filters.minSalary);
        if (filters.maxSalary) query['salary.amount'].$lte = Number(filters.maxSalary);
    }

    // Job type filter (array)
    if (filters.jobType && filters.jobType.length > 0) {
        query.jobType = { $in: filters.jobType };
    }

    // Experience level filter (array)
    if (filters.experienceLevel && filters.experienceLevel.length > 0) {
        query.experienceLevel = { $in: filters.experienceLevel };
    }

    // Skills filter (array) - matches any skill
    if (filters.skills && filters.skills.length > 0) {
        query['skills.name'] = { $in: filters.skills };
    }

    // Job title search (case-insensitive partial match)
    if (filters.jobTitle) {
        query.title = { $regex: filters.jobTitle, $options: 'i' };
    }

    // Location search (case-insensitive partial match)
    if (filters.location) {
        query.location = { $regex: filters.location, $options: 'i' };
    }

    // Has pre-screening questions filter
    if (filters.hasQuestions === 'true' || filters.hasQuestions === true) {
        query.preScreeningQuestions = { $exists: true, $not: { $size: 0 } };
    }

    // Date posted filter
    if (filters.datePosted) {
        const dateQuery = buildDateQuery(filters.datePosted);
        if (dateQuery) query.postedAt = dateQuery;
    }

    return query;
};

/**
 * Build date range query based on date filter option
 * @param {string} dateOption - Date filter option (today, this_week, etc.)
 * @returns {Object|null} MongoDB date query object
 */
const buildDateQuery = (dateOption) => {
    const now = new Date();

    switch (dateOption) {
        case 'today': {
            const startOfDay = new Date(now.setHours(0, 0, 0, 0));
            const endOfDay = new Date(now.setHours(23, 59, 59, 999));
            return { $gte: startOfDay, $lte: endOfDay };
        }

        case 'this_week': {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            return { $gte: startOfWeek };
        }

        case 'this_month': {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return { $gte: startOfMonth };
        }

        case 'last_3_months': {
            const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            return { $gte: threeMonthsAgo };
        }

        default:
            return null;
    }
};

/**
 * Build industry filter for aggregation pipeline
 * Industries are nested in company, so we need aggregation
 * @param {string[]} industries - Array of industry names
 * @returns {Object|null} Aggregation match stage
 */
export const buildIndustryMatch = (industries) => {
    if (!industries || industries.length === 0) return null;
    
    return {
        'company.industry': { 
            $in: industries.map(ind => new RegExp(ind, 'i')) 
        }
    };
};

/**
 * Parse filter parameters from query string
 * Handles comma-separated arrays and type conversions
 * @param {Object} queryParams - Express req.query object
 * @returns {Object} Parsed filters
 */
export const parseFilterParams = (queryParams) => {
    const filters = {};

    // Salary filters
    if (queryParams.minSalary) filters.minSalary = Number(queryParams.minSalary);
    if (queryParams.maxSalary) filters.maxSalary = Number(queryParams.maxSalary);

    // Array filters (comma-separated in query string)
    if (queryParams.jobType) {
        filters.jobType = queryParams.jobType.split(',').filter(Boolean);
    }
    if (queryParams.experienceLevel) {
        filters.experienceLevel = queryParams.experienceLevel.split(',').filter(Boolean);
    }
    if (queryParams.skills) {
        filters.skills = queryParams.skills.split(',').filter(Boolean);
    }
    if (queryParams.industry) {
        filters.industry = queryParams.industry.split(',').filter(Boolean);
    }

    // String filters
    if (queryParams.jobTitle) filters.jobTitle = queryParams.jobTitle.trim();
    if (queryParams.location) filters.location = queryParams.location.trim();

    // Boolean/special filters
    if (queryParams.hasQuestions) filters.hasQuestions = queryParams.hasQuestions;
    if (queryParams.datePosted) filters.datePosted = queryParams.datePosted;

    // Sorting
    if (queryParams.sortBy) filters.sortBy = queryParams.sortBy;

    // Cursor-based pagination
    if (queryParams.cursor) filters.cursor = queryParams.cursor;
    filters.limit = Number(queryParams.limit) || 20;

    // Exclude IDs (still useful for "don't show me this again" features)
    if (queryParams.exclude) {
        filters.excludeIds = queryParams.exclude.split(',').filter(Boolean);
    }

    return filters;
};