import express from "express"
import { createResume, deleteResume, getResume, getResumes, getResumesByUser, updateResume } from "../../controllers/resumes/resumeController.js"
import { generateResumeEmbeddings, getAllResumeEmbeddings } from "../../controllers/resumes/resumeEmbeddingController.js"

const router = express.Router()

router.get('/', getResumes)
router.get('/:id', getResume)
router.get('/user/:userId', getResumesByUser)

router.get('/embeddings', getAllResumeEmbeddings)
router.get('/:resumeId/embeddings', generateResumeEmbeddings)

router.post('/', createResume)
router.patch('/:id', updateResume)

router.delete('/:id', deleteResume)

export default router