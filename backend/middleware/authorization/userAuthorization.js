import { catchAsync } from "../../utils/errorUtils.js";
import { NotFoundError, UnauthorizedError, BadRequestError } from "../errorHandler.js";
import { findUserByEmail } from "../../repositories/users/userGetRepos.js";
import { findTempUserByEmail } from "../../repositories/tempUsers/tempUserRepositories.js";
import { secureCompare } from "../../helpers/userHelpers.js";

/**
 * Middleware to ensure that the logged-in user is allowed to access or modify the target user resource.
 * Compares req.user.id with user ID from request body or route parameters.
 *
 * Checks, in order:
 * - req.body.id
 * - req.body.userId
 * - req.params.id
 *
 * Throws a ForbiddenError if the logged-in user does not match the target user.
 *
 * Usage:
 * router.put('/:id/update', authenticate, authorizeSelf, updateUserController)
 *
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body, may contain `id` or `userId`
 * @param {Object} req.params - Route parameters, may contain `id`
 * @param {Object} req.user - Logged-in user object attached by authenticate middleware
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const authorizeSelf = catchAsync(async (req, res, next) => {
    const { id, userId: bodyUserId } = req.body;
    const paramId = req.params.id;
    const targetUserId = id || bodyUserId || paramId;

    if (!targetUserId) {
        throw new ForbiddenError('No target user specified');
    }

    if (targetUserId !== req.user.id && targetUserId !== req.user._id.toString()) {
        throw new ForbiddenError('You are not allowed to modify this user');
    }

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
