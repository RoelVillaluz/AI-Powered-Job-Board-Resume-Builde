import { catchAsync } from "../../utils/errorUtils.js";
import * as AuthService from "../../services/auth/authServices.js";
import { sendResponse, STATUS_MESSAGES } from "../../constants.js";

export const resendVerificationCode = catchAsync(async (req, res) => {
    const { email } = req.body;
    
    const { newCode } = await AuthService.resendVerificationCode(email)

    return sendResponse(res, {
        ...STATUS_MESSAGES.SUCCESS.RESENT_CODE,
        data: newCode
    });
})

export const verifyUser = catchAsync(async (req, res) => {
    const { email, verificationType } = req.body;

    // ✅ Pass middleware-validated data to service
    const result = await AuthService.verifyUser({ 
        email, 
        verificationType,
        tempUser: req.tempUser  // From middleware
    });

    const statusMessage = result.type === 'CREATE' 
        ? STATUS_MESSAGES.SUCCESS.CREATE 
        : STATUS_MESSAGES.SUCCESS.MATCHED_CODE;

    return sendResponse(res, { 
        ...statusMessage, 
        data: result.data 
    }, 'User');
});

export const loginUser = catchAsync(async (req, res) => {
    const { email, password } = req.body;

    const { user, token } = await AuthService.loginUser(email, password);

    return sendResponse(res, { ...STATUS_MESSAGES.SUCCESS.LOGIN, data: {
            token,
            user: { _id: user._id, email: user.email, role: user.role }
        },
    }, 'User')
})