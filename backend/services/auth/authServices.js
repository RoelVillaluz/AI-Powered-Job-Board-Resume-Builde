import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../middleware/errorHandler.js";
import { generateVerificationCode } from "../../helpers/userHelpers.js";
import User from "../../models/userModel.js";
import { TempUser } from "../../models/tempUserModel.js";
import { deleteTempUserByEmail } from "../../repositories/tempUsers/tempUserRepositories.js";
import { createTempUser } from "../../repositories/tempUsers/tempUserRepositories.js";
import { findUserByEmail } from "../../repositories/users/userGetRepos.js";
import { clearUserVerificationCode } from "../../repositories/users/userSetRepos.js";
import { sendVerificationEmail } from "../../utils/serverUtils.js";
import { withTransaction } from "../../helpers/transactionHelpers.js"

/**
 * Resends a verification code to a user or temporary user.
 * 
 * Generates a new verification code, updates it in the database,
 * and sends it via email to the provided user objects.
 * Works for either a registered user, a temporary user, or both.
 * 
 * @param {Object} params - Parameters object
 * @param {Object} [params.tempUser] - Temporary user object (from TempUser collection)
 * @param {Object} [params.user] - Registered user object (from User collection)
 * @returns {Promise<string>} The newly generated verification code
 * 
 * @throws {Error} If updating the database or sending the email fails
 */
export const resendVerificationCode = async ({ tempUser, user }) => {
    const newCode = generateVerificationCode();

    if (tempUser) {
        await TempUser.updateOne(
            { _id: tempUser._id },
            { verificationCode: newCode }
        );
        await sendVerificationEmail(tempUser, newCode);
    }

    if (user) {
        await User.updateOne(
            { _id: user._id },
            { verificationCode: newCode }
        );
        await sendVerificationEmail(user, newCode);
    }

    return newCode;
};

/**
 * Authenticates a user by email and password.
 * 
 * - Finds the user by email.
 * - Verifies the password using bcrypt.
 * - Generates a JWT token valid for 24 hours.
 * - Returns the user data (without password) and token.
 * 
 * @param {string} email - The email of the user trying to log in
 * @param {string} password - The plaintext password to verify
 * @returns {Promise<{ user: Object, token: string }>} 
 *          Object containing the user (without password) and JWT token
 * 
 * @throws {NotFoundError} If no user exists with the provided email
 * @throws {UnauthorizedError} If the password does not match
 */
export const loginUser = async (email, password) => {
    // ✅ Use flexible findUserByEmail with password included
    const user = await findUserByEmail(email, { includePassword: true });
    if (!user) throw new NotFoundError("User doesn't exist");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedError('Invalid email or password');

    const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
};

/**
 * Verifies a user action, either registration or password reset.
 * 
 * - For registration:
 *   - Creates a permanent user from a temporary user.
 *   - Deletes the temporary user inside a transaction.
 *   - Returns the new user's basic info.
 * 
 * - For password reset:
 *   - Clears the user's verification code.
 *   - Returns the email of the user whose code was verified.
 * 
 * @param {Object} params - Parameters object
 * @param {string} params.email - The user's email
 * @param {'register'|'password_reset'} params.verificationType - Type of verification
 * @param {Object} [params.tempUser] - Temporary user object (required for 'register' verificationType)
 * @returns {Promise<{ type: string, data: Object }>} 
 *          Object indicating verification type and related data
 * 
 * @throws {BadRequestError} If verificationType is invalid
 */
export const verifyUser = async ({ email, verificationType, tempUser }) => {
    if (verificationType === 'register') {
        const newUser = await withTransaction(async (session) => {
            const user = await createUserFromTempUser(tempUser, session);
            await deleteTempUserByEmail(email, session);
            return user;
        });

        return {
            type: 'CREATE',
            data: {
                _id: newUser._id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                role: newUser.role
            }
        };
    }

    if (verificationType === 'password_reset') {
        await clearUserVerificationCode(email);

        return {
            type: 'MATCHED_CODE',
            data: { email }
        };
    }

    throw new BadRequestError('Invalid verification type');
};
