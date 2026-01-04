import User from "../../models/userModel";

/**
 * Finds a user by email and allows selecting optional fields.
 * 
 * @param {string} email - The email of the user to find
 * @param {Object} [options] - Optional settings
 * @param {boolean} [options.includePassword=false] - Include the password field
 * @param {boolean} [options.includeVerificationCode=false] - Include verificationCode
 * @param {string[]} [options.additionalFields=[]] - Any additional fields to include
 * @returns {Promise<Object|null>} User object with requested fields, or null if not found
 */
export const findUserByEmail = async (
    email,
    { includePassword = false, includeVerificationCode = false, additionalFields = [] } = {}
) => {
    let fields = ['email', 'firstName', 'lastName', 'role', 'profilePicture', 'industry', ...additionalFields];

    if (includePassword) fields.push('password');
    if (includeVerificationCode) fields.push('verificationCode');

    return await User.findOne({ email })
        .select(fields.join(' '))
        .populate('company', 'id name')
        .lean();
};

/**
 * Finds users by name with optional search filtering and limit.
 * Supports partial name matching (first name, last name, or full name).
 * Case-insensitive search using regex.
 * 
 * @param {Object} params - Search parameters
 * @param {string} [params.name] - Name to search for
 * @param {number} [params.limit] - Maximum number of results to return
 * @returns {Promise<Array>} Array of user objects matching the search criteria
 */
export const findUsers = async ({ name, limit }) => {
    const query = {};

    if (name) {
        const parts = name.trim().split(/\s+/);

        if (parts.length === 1) {
            query.$or = [
                { firstName: { $regex: parts[0], $options: 'i' } },
                { lastName: { $regex: parts[0], $options: 'i' } }
            ];
        } else {
            query.$and = [
                { firstName: { $regex: parts[0], $options: 'i' } },
                { lastName: { $regex: parts[1], $options: 'i' } }
            ];
        }
    }

    return await User.find(query)
        .select('email firstName lastName role profilePicture industry')
        .populate('company', 'id name')
        .limit(limit)
        .lean();
};

/**
 * Finds a single user by their ID.
 * Returns basic user profile information without sensitive data.
 * 
 * @param {string} id - The MongoDB ObjectId of the user
 * @returns {Promise<Object|null>} User object, or null if not found
 */
export const findUser = async (id) => {
    return await User.findById(id)
        .select('email firstName lastName role profilePicture industry')
        .populate('company', 'id name')
        .lean();
};

/**
 * Checks if a user exists with the given email address.
 * Used for email uniqueness validation during registration.
 * 
 * @param {string} email
 * @returns {Promise<Object|null>} Object with _id if exists, null otherwise
 */
export const userExistsByEmail = async (email) => {
    return await User.exists({ email });
};