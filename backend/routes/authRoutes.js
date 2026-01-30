import express from "express"
import { resendVerificationCode, verifyUser, loginUser, changePassword } from "../controllers/auth/authControllers.js"
import { attachVerificationUser, validateVerificationCode } from "../middleware/authorization/userAuthorization.js"
import { checkEmailIfExists } from "../middleware/resourceCheck/emails.js"
import { verificationSchema } from "../validators/verificationCodeValidator.js"
import { validate } from "../middleware/validation.js"
import { passwordSchema } from "../validators/userValidators.js"

const router = express.Router()

router.post('/resend-verification-code', 
    checkEmailIfExists,
    resendVerificationCode
)

router.post('/verify', 
    validate(verificationSchema),
    attachVerificationUser,
    validateVerificationCode,
    verifyUser
)

router.post('/login', 
    checkEmailIfExists,
    loginUser
)

router.put('/change-password', 
    validate(passwordSchema, 'body'),
    checkEmailIfExists,
    changePassword
)

export default router