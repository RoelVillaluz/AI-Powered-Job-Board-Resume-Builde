import { catchAsync } from "../../utils/errorUtils.js";
import { ForbiddenError, NotFoundError, UnauthorizedError, BadRequestError } from "../errorHandler.js";
import { userExistsByEmail, findUserByEmail } from "../../repositories/users/userGetRepos.js";
import { tempUserExistsByEmail, findTempUserByEmail } from "../../repositories/tempUsers/tempUserRepositories.js";
import { secureCompare } from "../../helpers/cryptoHelpers.js";

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

/**
 * Attaches the correct user object to the request based on verification type.
 * For 'register', attaches `req.tempUser`.
 * For 'password_reset', attaches `req.verifiedUser`.
 * Throws NotFoundError or BadRequestError if the required data is missing.
 * Used on: /verify
 * 
 * @param {Object} req - Express request object, expects `req.body.email` and `req.body.verificationType`
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const attachVerificationUser = catchAsync(async (req, res, next) => {
    const { email, verificationType } = req.body;

    if (verificationType === 'register') {
        const tempUser = await findTempUserByEmail(email);
        if (!tempUser) throw new NotFoundError('Registration request not found or expired');
        req.tempUser = tempUser;
    } else if (verificationType === 'password_reset') {
        const user = await findUserByEmail(email, { includeVerificationCode: true });
        if (!user) throw new NotFoundError('User not found');
        if (!user.verificationCode) throw new BadRequestError('No password reset request found for this user');
        req.verifiedUser = user;
    }

    next();
});

/**
 * Validates the verification code provided in the request body.
 * Compares against the stored code for tempUser or verifiedUser.
 * Throws UnauthorizedError if the code does not match.
 * Requires attachVerificationUser middleware to run first.
 * Used on: /verify
 * 
 * @param {Object} req - Express request object, expects `req.body.verificationCode`, `req.body.verificationType`, and `req.tempUser` or `req.verifiedUser`
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const validateVerificationCode = catchAsync(async (req, res, next) => {
    const { verificationCode, verificationType } = req.body;

    if (verificationType === 'register') {
        if (!secureCompare(req.tempUser.verificationCode.toString(), verificationCode.toString())) {
            throw new UnauthorizedError('Invalid verification code');
        }
    } else if (verificationType === 'password_reset') {
        if (!secureCompare(req.verifiedUser.verificationCode.toString(), verificationCode.toString())) {
            throw new UnauthorizedError('Invalid verification code');
        }
    }

    next();
});
