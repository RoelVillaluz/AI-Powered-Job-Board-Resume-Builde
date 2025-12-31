import jwt from 'jsonwebtoken';
import { NotFoundError, UnauthorizedError } from '../errorHandler.js';
import { catchAsync } from '../../utils/errorUtils.js';
import User from '../../models/userModel.js';

export const authenticate = catchAsync(async (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
        throw new UnauthorizedError('No authentication token provided.')
    }
    
    // Let catchAsync handle jwt.verify errors
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify if user exists in the database
    const user = await User.findById(decoded._id).select('-password')
    if (!user) throw new NotFoundError('User')

    req.user = decoded;
    next();
})
