// Helper function to check if any required field is missing
export const checkMissingFields = (fields, body) => {
    for (let field of fields) {
        if (!body[field]) {
            return field // Return the name of the first missing field
        }
    }
    return null; // All required fields are present
}   