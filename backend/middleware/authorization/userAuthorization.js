import { catchAsync } from "../../utils/errorUtils.js";
import User from "../../models/userModel.js";
import { ForbiddenError } from "../errorHandler.js";

export const checkEmailIfUnique = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ForbiddenError('Email already exists');
    }

    const existingTempUser = await TempUser.findOne({ email });
    if (existingTempUser) {
        throw new ForbiddenError('A verification email has already been sent to this email');
    }

    next();
});
