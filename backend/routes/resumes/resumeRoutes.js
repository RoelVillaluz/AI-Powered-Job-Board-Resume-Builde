import express from "express"
import { createResume, deleteResume, getResume, getResumes, getResumesByUser, updateResume } from "../../controllers/resumes/resumeController.js"
import { generateResumeEmbeddings, getAllResumeEmbeddings } from "../../controllers/resumes/resumeEmbeddingController.js"

const router = express.Router()

// Static routes first
router.get('/embeddings', getAllResumeEmbeddings)
router.get('/user/:userId', getResumesByUser)

// Dynamic routes next
router.get('/:resumeId/embeddings', generateResumeEmbeddings)
router.get('/:id', getResume)
router.get('/', getResumes)

router.post('/', createResume)
router.patch('/:id', updateResume)
router.delete('/:id', deleteResume)

export default router