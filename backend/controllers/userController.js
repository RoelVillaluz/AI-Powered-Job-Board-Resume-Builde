import User from '../models/userModel.js';
import { checkMissingFields } from '../utils.js';
import { STATUS_MESSAGES, sendResponse } from '../constants.js';
import bcrypt from 'bcrypt';

export const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: users }, 'Users');
    } catch (error) {
        console.error('Error fetching users:', error);
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false });
    }
};

export const getUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id).select('-password');
        if (!user) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, 'User');
        }
        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.FETCH, data: user }, 'User');
    } catch (error) {
        console.error('Error fetching user:', error);
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false });
    }
};

export const createUser = async (req, res) => {
    const user = req.body;
    const requiredFields = ['name', 'email', 'password', 'role'];

    // Check for missing fields
    const missingField = checkMissingFields(requiredFields, user);
    if (missingField) {
        return sendResponse(res, STATUS_MESSAGES.ERROR.MISSING_FIELD(missingField), 'User');
    }

    try {
        const existingEmail = await User.findOne({ email: user.email });
        if (existingEmail) {
            return sendResponse(res, STATUS_MESSAGES.ERROR.EMAIL_EXISTS, 'User');
        }

        // Hash the password before saving the user
        const hashedPassword = await bcrypt.hash(user.password, 10); // 10 is the salt rounds
        user.password = hashedPassword;

        const newUser = new User(user);
        await newUser.save();
        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.CREATE, data: newUser }, 'User');
    } catch (error) {
        console.error('Error creating user:', error.message);
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false });
    }
};

export const updateUser = async (req, res) => {
    const { id } = req.params;
    const user = req.body;

    try {
        const updatedUser = await User.findByIdAndUpdate(id, user, { new: true });
        if (!updatedUser) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, 'User');
        }
        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.UPDATE, data: updatedUser }, 'User');
    } catch (error) {
        console.error('Error updating user:', error);
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false });
    }
};

export const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, 'User');
        }
        return sendResponse(res, STATUS_MESSAGES.SUCCESS.DELETE, 'User');
    } catch (error) {
        console.error('Error deleting user:', error);
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER, success: false });
    }
};
