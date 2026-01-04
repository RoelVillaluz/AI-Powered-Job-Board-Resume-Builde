import express from "express"
import { resendVerificationCode, verifyUser, loginUser } from "../controllers/auth/authControllers.js"
import { attachVerificationUser, checkEmailIfExists, validateVerificationCode } from "../middleware/authorization/userAuthorization.js"
import { verificationSchema } from "../validators/verificationCodeValidator.js"
import { validate } from "../middleware/validation.js"

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

export default router