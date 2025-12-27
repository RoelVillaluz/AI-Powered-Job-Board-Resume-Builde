import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errorHandler.js';
import { catchAsync } from '../../utils/errorUtils.js';

export const authenticate = catchAsync(async (req, res, next) => {
    // Get token from header
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
        throw new UnauthorizedError('No authentication token provided.')
    }

    try {
        const decoded = jwt.verify(token, process.env.dev.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        throw new UnauthorizedError('Invalid or expired token');
    }
})
