/**
 * Build cursor query for pagination
 * @param {string} cursor - Base64 encoded cursor string
 * @param {Object} sortConfig - Sort configuration from buildSortQuery
 * @returns {Object|null} MongoDB cursor query
 */
export const buildCursorQuery = (cursor, sortConfig) => {
    if (!cursor) return null;
    
    try {
        // Decode cursor: "2024-01-15T10:30:00.000Z|507f1f77bcf86cd799439011"
        const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
        const [primaryValue, idValue] = decoded.split('|');
        
        const { sort, cursorFields } = sortConfig;
        const [primaryField] = cursorFields;
        const primarySortDir = sort[primaryField];
        
        // Build comparison query based on sort direction
        const cursorQuery = {
            $or: [
                // Primary field comparison
                {
                    [primaryField]: primarySortDir === 1 
                        ? { $gt: parseCursorValue(primaryValue, primaryField) }
                        : { $lt: parseCursorValue(primaryValue, primaryField) }
                },
                // Tie-breaker with _id
                {
                    [primaryField]: parseCursorValue(primaryValue, primaryField),
                    _id: primarySortDir === 1
                        ? { $gt: idValue }
                        : { $lt: idValue }
                }
            ]
        };
        
        return cursorQuery;
    } catch (error) {
        console.error('Invalid cursor:', error);
        return null;
    }
};

/**
 * Parse cursor value to correct type
 * @param {string} value - String value from cursor
 * @param {string} field - Field name to determine type
 * @returns {*} Parsed value
 */
const parseCursorValue = (value, field) => {
    if (field === 'postedAt') {
        return new Date(value);
    }
    if (field === 'salary.amount') {
        return Number(value);
    }
    return value; // String (title)
};

/**
 * Create cursor from document
 * @param {Object} doc - MongoDB document
 * @param {Array} cursorFields - Fields to include in cursor
 * @returns {string} Base64 encoded cursor
 */
export const createCursor = (doc, cursorFields) => {
    if (!doc) return null;
    
    const [primaryField] = cursorFields;
    
    // Extract values
    let primaryValue;
    if (primaryField.includes('.')) {
        // Handle nested fields like 'salary.amount'
        const parts = primaryField.split('.');
        primaryValue = doc[parts[0]]?.[parts[1]];
    } else {
        primaryValue = doc[primaryField];
    }
    
    // Convert to string
    if (primaryValue instanceof Date) {
        primaryValue = primaryValue.toISOString();
    }
    
    const cursorString = `${primaryValue}|${doc._id}`;
    return Buffer.from(cursorString).toString('base64');
};
