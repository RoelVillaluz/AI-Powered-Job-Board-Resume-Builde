import express from "express"
import { getConversations, getConversationById, getConversationsByUser } from "../../controllers/chat/conversationController.js";

const router = express.Router();

router.get('/', getConversations)
router.get('/user/:userId', getConversationsByUser)  
router.get('/:conversationId', getConversationById)  


export default router