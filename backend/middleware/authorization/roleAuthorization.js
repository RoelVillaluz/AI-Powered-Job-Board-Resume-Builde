import { ForbiddenError } from "../errorHandler.js";

/**
 * Validates if current user role is authorized to do a specific action
 *
 * @param {...string} allowedRoles - One or more roles allowed to access the route.
 * @returns {Function} Express middleware function.
 *
 * @throws {UnauthorizedError} If `req.user` is missing (not authenticated).
 * @throws {ForbiddenError} If the user's role is not in the allowedRoles array.
 *
 * @example
 * // Only jobseekers can access this route
 * router.post('/jobs/:id/apply', requireRole('jobseeker'), applyToJob);
 */
export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        const user = req.user;

        if (!user) {
            throw new UnauthorizedError('Invalid authentication data');
        }

        if (!allowedRoles.includes(user.role)) {
            throw new ForbiddenError(
                `This action requires one of the following roles: ${allowedRoles.join(', ')}`
            );
        }

        next();
    };
};