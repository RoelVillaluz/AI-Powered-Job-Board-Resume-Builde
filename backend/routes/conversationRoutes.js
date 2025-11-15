import express from "express"
import { getConversations, getConversationById, getConversationsByUser, getFilesByConversationId } from "../controllers/conversationController.js";

const router = express.Router();

router.get('/', getConversations)
router.get('/:conversationId', getConversationById)
router.get('/:conversationId/files', getFilesByConversationId)
router.get('/user/:userId', getConversationsByUser)


export default router