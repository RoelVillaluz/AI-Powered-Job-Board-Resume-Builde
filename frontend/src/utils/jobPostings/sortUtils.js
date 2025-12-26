/**
 * Build MongoDB sort object from sort parameter
 * Returns array of [sortField, sortValue] for cursor-based pagination
 * @param {string} sortBy - Sort type
 * @returns {Object} { sort: Object, cursorFields: Array }
 */
export const buildSortQuery = (sortBy) => {
    let primarySort, primaryField;
    
    switch (sortBy) {
        case 'A-Z':
            primarySort = { title: 1, _id: 1 };
            primaryField = 'title';
            break;
        case 'Z-A':
            primarySort = { title: -1, _id: -1 };
            primaryField = 'title';
            break;
        case 'Newest First':
            primarySort = { postedAt: -1, _id: -1 };
            primaryField = 'postedAt';
            break;
        case 'Highest Salary':
            primarySort = { 'salary.amount': -1, _id: -1 };
            primaryField = 'salary.amount';
            break;
        case 'Best Match':
        default:
            primarySort = { postedAt: -1, _id: -1 };
            primaryField = 'postedAt';
            break;
    }
    
    return {
        sort: primarySort,
        cursorFields: [primaryField, '_id'] // Fields used in cursor
    };
};