import jwt from 'jsonwebtoken';
import { NotFoundError, UnauthorizedError } from '../errorHandler.js';
import { catchAsync } from '../../utils/errorUtils.js';
import User from '../../models/userModel.js';

export const authenticate = catchAsync(async (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        throw new UnauthorizedError('No authentication token provided.');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Support both id and _id from JWT payload
    const decodedId = decoded.id || decoded._id;

    const user = await User.findById(decodedId).select('-password');
    if (!user) throw new NotFoundError('User');

    req.user = decoded;
    next();
});
