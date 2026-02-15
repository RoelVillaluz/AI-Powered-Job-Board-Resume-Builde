import express from "express"
import multer from "multer"
import path from "path";
import { getUser, getUsers, registerUser, deleteUser, getUserConnectionRecommendations, updateUser } from "../../controllers/users/userController.js";
import { getUserInteractedJobs, toggleSaveJob, applyToJob } from "../../controllers/users/userJobsController.js";
import { authenticate } from "../../middleware/authentication/authenticate.js";
import { requireRole } from "../../middleware/authorization/roleAuthorization.js";
import { checkIfJobExists } from "../../middleware/resourceCheck/jobPosting.js";
import { checkEmailIfUnique } from "../../middleware/resourceCheck/emails.js";
import { authorizeSelf } from "../../middleware/authorization/userAuthorization.js";

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

// GET
router.get('/', 
    getUsers
)

router.get('/:id', getUser

)

router.get('/:id/interacted-jobs/:jobActionType?', 
    authenticate,
    authorizeSelf,
    getUserInteractedJobs
);

router.get('/:id/connection-recommendations', 
    authenticate,
    authorizeSelf,
    getUserConnectionRecommendations
)

// POST
router.post('/', 
    checkEmailIfUnique,
    registerUser
)

router.post('/save-job/:jobId', 
    authenticate,
    requireRole('jobseeker'),
    checkIfJobExists,
    toggleSaveJob
)
router.post('/apply-to-job/:jobId', 
    authenticate,
    requireRole('jobseeker'),
    checkIfJobExists,
    applyToJob
)

// PATCH
router.patch('/:id',
    authenticate,
    updateUser
)

// DELETE
router.delete('/:id', 
    authenticate,
    deleteUser
)

export default router