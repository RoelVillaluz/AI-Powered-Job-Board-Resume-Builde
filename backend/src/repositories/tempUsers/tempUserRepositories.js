import { generateVerificationCode } from "../../helpers/userHelpers.js";
import { TempUser } from "../../models/tempUserModel.js";
import bcrypt from 'bcrypt';

// ===============================
// READ / FIND
// ===============================

/**
 * Finds a temporary user by email address.
 * 
 * @param {string} email
 * @returns {Promise<Object|null>} Temporary user object, or null if not found
 */
export const findTempUserByEmail = async (email) => {
    return await TempUser.findOne({ email }).lean();
};

// ===============================
// CREATE
// ===============================

/**
 * Creates a new temporary user document with registration data.
 * 
 * @param {Object} data - Temporary user data
 * @param {string} data.email
 * @param {string} data.password
 * @param {string} data.firstName
 * @param {string} data.lastName
 * @param {string} data.verificationCode
 * @param {string} [data.role]
 * @returns {Promise<Object>} Newly created temporary user document
 */
export const createTempUser = async (data) => {
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const tempUser = new TempUser({
        ...data,
        password: hashedPassword,
        verificationCode: generateVerificationCode(),
    });

    await tempUser.save();
    return tempUser;
};

// ===============================
// DELETE / REMOVE
// ===============================

/**
 * Deletes a temporary user document by email address.
 * Supports optional transaction session.
 * 
 * @param {string} email
 * @param {Object} [session=null] - Mongoose session for transaction
 * @returns {Promise<Object>} Deletion result
 */
export const deleteTempUserByEmail = async (email, session = null) => {
    return await TempUser.deleteOne({ email }, { session });
};

// ===============================
// CHECK / EXISTS
// ===============================

/**
 * Checks if a temporary user exists with the given email address.
 * 
 * @param {string} email
 * @returns {Promise<Object|null>} Object with _id if exists, null otherwise
 */
export const tempUserExistsByEmail = async (email) => {
    return await TempUser.exists({ email });
};
