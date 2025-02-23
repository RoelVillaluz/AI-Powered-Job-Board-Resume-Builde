import User from '../models/userModel.js';
import { TempUser } from '../models/tempUserModel.js';
import { checkMissingFields, sendVerificationEmail } from '../utils.js';
import { STATUS_MESSAGES, sendResponse } from '../constants.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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

export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password"); 

        if (!user) {
            return sendResponse(res, {...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false}, 'User');
        }

        return sendResponse(res, {
            ...STATUS_MESSAGES.SUCCESS.FETCH,
            data: { user },
        }, 'User');
    } catch (error) {
        console.error('Error fetching current user:', error);
        return sendResponse(res, STATUS_MESSAGES.ERROR.SERVER, 'User');
    }
};


export const authenticateUser = async (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1]; // Expecting "Bearer <token>"

    if (!token) {
        return res.status(401).json({ message: "Unauthorized, no token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user payload to request
        next();
    } catch (error) {
        return sendResponse(res, { ...STATUS_MESSAGES.ERROR.SERVER })
    }
};

export const createUser = async (req, res) => {
    const user = req.body;
    const requiredFields = ['email', 'password', 'role'];

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

export const resendVerificationCode = async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return sendResponse(res, STATUS_MESSAGES.ERROR.MISSING_FIELD("email"), "User");
    }

    try {
        const tempUser = await TempUser.findOne({ email })
        if (!tempUser) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false }, 'User');
        }

        const newVerificationCode = Math.floor(10000 + Math.random() * 900000).toString();
        tempUser.verificationCode = newVerificationCode
        await sendVerificationEmail(tempUser, newVerificationCode)
        await tempUser.save()

        return sendResponse(res, {...STATUS_MESSAGES.SUCCESS.RESENT_CODE, data: tempUser})
    } catch (error) {
        console.error("Error resending verification code:", error.message);
        return sendResponse(res, STATUS_MESSAGES.ERROR.SERVER, "User");
    }
}


export const verifyUser = async (req, res) => {
    const { email, verificationCode } = req.body;

    try {
        const tempUser = await TempUser.findOne({ email })

        if (!tempUser) {
            return sendResponse(res, {...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false}, 'User')
        }

        if (tempUser.verificationCode.toString() !== verificationCode.toString()) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.INVALID_CODE, success: false})
        }

        const newUser = new User({
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

export const loginUser = async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return sendResponse(res, STATUS_MESSAGES.ERROR.MISSING_FIELD('email or password'), 'User');
    }

    try {
        const user = await User.findOne({ email })

        if (!user) {
            return sendResponse(res, {...STATUS_MESSAGES.ERROR.NOT_FOUND, success: false}, 'User')
        }

        console.log("Entered password:", password);
        console.log("Stored hashed password:", user.password);

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return sendResponse(res, { ...STATUS_MESSAGES.ERROR.INVALID_CREDENTIALS, success: false }, 'User');
        }

        const payload = {
            id: user._id,
            email: user.email,
            role: user.role,
        };


        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        return sendResponse(res, {
            ...STATUS_MESSAGES.SUCCESS.LOGIN,
            data: { 
                token ,
                user: { id: user._id, email: user.email, role: user.role }
            },
        }, 'User');
    } catch (error) {
        console.error('Error during login:', error);
        return sendResponse(res, STATUS_MESSAGES.ERROR.SERVER, 'User');
    }
}