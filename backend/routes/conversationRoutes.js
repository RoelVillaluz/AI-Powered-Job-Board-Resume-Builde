import express from "express"
import { getConversations, getConversationById, getConversationsByUser } from "../controllers/conversationController.js";

const router = express.Router();

router.get('/', getConversations)
router.get('/:conversationId', getConversationById)
router.get('/user/:userId', getConversationsByUser)


export default router