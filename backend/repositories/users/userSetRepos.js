import User from "../../models/userModel.js";
import { hashVerificationCode } from "../../helpers/userHelpers.js";
import JobPosting from "../../models/jobPostingModel.js";
import { findUser } from "./userGetRepos.js";

/**
 * Creates a new user document.
 * Used for direct user creation (not from temporary user).
 * 
 * @param {Object} userData - The user data to create
 * @param {string} userData.email
 * @param {string} userData.password
 * @param {string} userData.firstName
 * @param {string} userData.lastName
 * @param {string} [userData.role]
 * @returns {Promise<Object>} Newly created user document
 */
export const createUser = async (userData) => {
    const newUser = new User(userData);
    return await newUser.save();
};

/**
 * Updates a user's data by their ID.
 * Runs validation on the updated fields and returns the updated document.
 * 
 * @param {string} id - MongoDB ObjectId of the user
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object|null>} Updated user object, or null if not found
 */
export const updateUser = async (id, updateData) => {
    return await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).lean();
};

/**
 * Updates a user's password and removes their verification code.
 * 
 * @param {string} email
 * @param {string} hashedPassword
 * @returns {Promise<Object>} Updated user without password field
 */
export const updateUserPassword = async (email, hashedPassword) => {
    return await User.findOneAndUpdate(
        { email },
        { password: hashedPassword, $unset: { verificationCode: 1 } },
        { new: true, runValidators: true }
    ).select('-password').lean();
};

/**
 * Sets a verification code for a user.
 * 
 * @param {string} email
 * @param {string} verificationCode
 * @returns {Promise<Object>} Updated user with email and verification code
 */
export const updateUserVerificationCode = async (email, verificationCode) => {
    const hashedCode = await hashVerificationCode(verificationCode);
    return await User.findOneAndUpdate(
        { email },
        { verificationCode: hashedCode }, // Store hashed
        { new: true }
    ).select('email verificationCode').lean(); 
};

/**
 * Clears the verification code from a user's document.
 * 
 * @param {string} email
 * @returns {Promise<Object>} Updated user without verification code
 */
export const clearUserVerificationCode = async (email) => {
    return await User.findOneAndUpdate(
        { email },
        { $unset: { verificationCode: 1 } },
        { new: true }
    ).lean();
};

export const toggleSaveJob = async (jobId, userId) => {
    const user = await User.findById(userId)

    const isSaved = user.savedJobs.some(
        savedJobId => savedJobId.toString() === jobId
    );

    if (isSaved) {
        user.savedJobs.pull(jobId);
    } else {
        user.savedJobs.addToSet(jobId);
    }

    await user.save();

    return {
        isSaved: !isSaved
    };
};


/**
 * Deletes a user by their ID.
 * Permanently removes the user document from the database.
 * 
 * @param {string} id - MongoDB ObjectId of the user to delete
 * @returns {Promise<Object|null>} Deleted user object, or null if not found
 */
export const deleteUser = async (id) => {
    return await User.findOneAndDelete({ _id: id });
};