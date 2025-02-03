import User from '../models/userModel.js';
import { TempUser } from '../models/tempUserModel.js';
import { checkMissingFields, sendVerificationEmail } from '../utils.js';
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
        return sendResponse(res, STATUS_MESSAGES.ERROR.BAD_REQUEST, 'User');
    }

    if (user.password.length < 8) {
        return sendResponse(res, STATUS_MESSAGES.ERROR.WEAK_PASSWORD, 'User');
    }

    try {
        const existingEmail = await User.findOne({ email: user.email });
        if (existingEmail) {
            return sendResponse(res, {...STATUS_MESSAGES.ERROR.EMAIL_EXISTS, success: false}, 'User');
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(user.password, 10);

        // Generate verification code
        const verificationCode = Math.floor(10000 + Math.random() * 900000).toString();

        // Create a temp user
        const tempUser = new TempUser({
            name: user.name,
            email: user.email,
            password: hashedPassword,
            role: user.role,
            verificationCode
        });

        const existingTempUser = await TempUser.findOne({ email: user.email })
        if (existingTempUser) {
            existingTempUser.verificationCode = verificationCode;
            await existingTempUser.save();
            await sendVerificationEmail(existingTempUser, verificationCode);
            return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.CREATE, message: "Verification code resent to email." }, 'User');
        }

        await tempUser.save();

        // Send verification email
        await sendVerificationEmail(tempUser, verificationCode);

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.CREATE, message: "Verification code sent to email." }, 'User');
    } catch (error) {
        console.error('Error creating user:', error.message);
        return sendResponse(res, STATUS_MESSAGES.ERROR.SERVER, 'User');
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


export const verifyUser = async (req, res) => {
    const { email, verificationCode } = req.body;

    try {
        const tempUser = await TempUser.findOne({ email })

        if (!tempUser) {
            return sendResponse(res, {...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false}, 'User')
        }

        if (tempUser.verificationCode !== verificationCode) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.INVALID_CODE, success: false})
        }

        const newUser = new User({
            name: tempUser.name,
            email: tempUser.email,
            password: tempUser.password, // Already hashed
            role: tempUser.role,
            isVerified: true,
        })

        await newUser.save()
        await TempUser.deleteOne({ email })

        return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.CREATE, data: newUser }, 'User')
    } catch (error) {
        console.error('Error', error)
        return sendResponse(res, STATUS_MESSAGES.ERROR.SERVER, 'User');
    }
}