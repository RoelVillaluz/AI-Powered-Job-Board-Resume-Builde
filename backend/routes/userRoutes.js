import express from "express"
import { getUsers, getUser, createUser, updateUser, deleteUser } from "../controllers/userController.js"

const router = express.Router();

router.get('/', getUsers)
router.get('/:id', getUser)
router.post('/', createUser)
router.patch('/:id', updateUser)
router.delete('/:id', deleteUser)

export default router