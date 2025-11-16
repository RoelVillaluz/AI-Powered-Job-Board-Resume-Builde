import express from "express"
import { getConversations, getConversationById, getConversationsByUser, getFilesByConversationId, getPinnedMessagesByConversationId } from "../controllers/conversationController.js";

const router = express.Router();

router.get('/', getConversations)
router.get('/:conversationId', getConversationById)

router.get('/:conversationId/resources/files', getFilesByConversationId)
router.get('/:conversationId/resources/pinned-messages', getPinnedMessagesByConversationId)

router.get('/user/:userId', getConversationsByUser)


export default router