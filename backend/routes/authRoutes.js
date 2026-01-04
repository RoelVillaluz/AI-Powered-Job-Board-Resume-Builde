import express from "express"
import { resendVerificationCode, verifyUser, loginUser } from "../controllers/auth/authControllers"
import { attachVerificationUser, checkEmailIfExists, validateVerificationCode } from "../middleware/authorization/userAuthorization"
import { verificationSchema } from "../validators/verificationCodeValidator"

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