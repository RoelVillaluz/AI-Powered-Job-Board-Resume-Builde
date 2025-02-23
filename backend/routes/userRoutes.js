import express from "express"
import { getUsers, getUser, getCurrentUser, authenticateUser, createUser, updateUser, deleteUser, verifyUser, resendVerificationCode, loginUser } from "../controllers/userController.js"

const router = express.Router();

router.get('/', getUsers)
router.get("/me", authenticateUser, getCurrentUser)
router.get('/:id', getUser)

router.post('/', createUser)
router.post('/resend-verification-code', resendVerificationCode)
router.post('/verify', verifyUser)
router.post('/login', loginUser)

router.patch('/:id', updateUser)

router.delete('/:id', deleteUser)

export default router