import { userExistsByEmail, findUserByEmail } from "../../repositories/users/userGetRepos.js";
import { tempUserExistsByEmail, findTempUserByEmail } from "../../repositories/tempUsers/tempUserRepositories.js";
import { ForbiddenError, NotFoundError } from "../errorHandler.js";
import { catchAsync } from "../../utils/errorUtils.js";

/**
 * Ensures email is available for new registration.
 * Throws ForbiddenError if email already exists in User or TempUser collections.
 * Used on: /register
 * 
 * @param {Object} req - Express request object, expects `req.body.email`
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const checkEmailIfUnique = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    const [existingUser, existingTempUser] = await Promise.all([
        userExistsByEmail(email),
        tempUserExistsByEmail(email)
    ]);

    if (existingUser) throw new ForbiddenError('Email already exists');
    if (existingTempUser) throw new ForbiddenError('A verification email has already been sent to this email');

    next();
});

/**
 * Ensures email exists in either User or TempUser collections.
 * Attaches `req.user` and/or `req.tempUser` for downstream verification logic.
 * Throws NotFoundError if no matching user is found.
 * Used on: /verify
 * 
 * @param {Object} req - Express request object, expects `req.body.email`
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const checkEmailIfExists = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    // Flexible finders now return null if not found
    const [tempUser, user] = await Promise.all([
        findTempUserByEmail(email),
        findUserByEmail(email, { includeVerificationCode: true })
    ]);

    if (!tempUser && !user) throw new NotFoundError("User not found for verification");

    req.tempUser = tempUser;
    req.user = user;

    next();
});