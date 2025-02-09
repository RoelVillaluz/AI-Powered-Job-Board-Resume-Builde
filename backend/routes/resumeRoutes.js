import express from "express"
import { createResume, deleteResume, getResume, getResumes, updateResume } from "../controllers/resumeController.js"

const router = express.Router()

router.get('/', getResumes)
router.get('/:id', getResume)
router.post('/', createResume)
router.patch('/:id', updateResume)
router.delete('/:id', deleteResume)

export default router