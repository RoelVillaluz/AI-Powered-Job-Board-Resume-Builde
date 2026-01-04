import express from "express"
import { getUsers, getUser, getCurrentUser, authenticateUser, createUser, updateUser, deleteUser, verifyUser, resendVerificationCode, loginUser, trackUserLogin, getUserInteractedJobs, toggleSaveJob, applyToJob, sendConnectionRequest, changePassword, searchUsers  } from "../../controllers/userController.js"
import multer from "multer"
import path from "path";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'backend/public/profile_pictures')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
})

const upload = multer({ storage: storage })

const router = express.Router();

router.get('/', getUsers)
router.get("/me", authenticateUser, getCurrentUser)
router.get('/search', searchUsers)
router.get('/:id', getUser)
router.get('/:id/interacted-jobs/:jobActionType?', getUserInteractedJobs);

router.post('/', createUser)
router.post('/track-login/:userId', trackUserLogin)
router.post('/save-job/:jobId', authenticateUser, toggleSaveJob)
router.post('/apply-to-job/:jobId', authenticateUser, applyToJob)
router.post('/send-connection-request', sendConnectionRequest)

router.patch('/:id', upload.single('profilePicture'), updateUser)

router.put('/change-password', changePassword)

router.delete('/:id', deleteUser)

export default router