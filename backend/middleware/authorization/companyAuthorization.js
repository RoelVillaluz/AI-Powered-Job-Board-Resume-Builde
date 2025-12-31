import { catchAsync } from "../../utils/errorUtils.js";
import { ForbiddenError, UnauthorizedError } from "../errorHandler.js";

/**
 * Validates if user role is employer before allowing them to handle company related updates/actions
 * @returns {Promise<Object>}
 */
export const requireEmployerRole = catchAsync(async (req, res, next) => {
    const user = req.user // comes from authenticate middleware

    if (!user) throw new UnauthorizedError('Invalid authentication data')

    if (user.role !== 'employer') {
        throw new ForbiddenError(
            `This action requires employer role. Your current role: ${user.role}`
        );
    }

    next() // user is authenticated and authorized
})

/**
 * Middleware to enforce that the company being created or updated is always linked to the logged-in user.
 * This prevents a user from creating a company on behalf of another user.
 * 
 * @param {Object} req - Express request object, expects `req.user` to exist
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const enforceCompanyOwnership = catchAsync(async (req, res, next) => {
    req.body.user = req.user.id; 
    next();
});

/**
 * Middleware to ensure that a logged-in employer can only create a single company.
 * Throws a ForbiddenError if a company already exists for this user.
 * 
 * @param {Object} req - Express request object, expects `req.user` to exist
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const ensureSingleCompanyPerEmployer = catchAsync(async (req, res, next) => {
    const userId = req.user.id;

    const existingCompany = await Company.findOne({ user: userId });
    if (existingCompany) {
        throw new ForbiddenError('You already have a company. Cannot create another.');
    }

    next();
});