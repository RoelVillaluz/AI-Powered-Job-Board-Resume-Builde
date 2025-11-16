import express from "express"
import { getConversations, getConversationById, getConversationsByUser, getAttachmentsByConversationId, getPinnedMessagesByConversationId } from "../controllers/conversationController.js";

const router = express.Router();

router.get('/', getConversations)
router.get('/:conversationId', getConversationById)

router.get('/:conversationId/resources/attachments', getAttachmentsByConversationId)
router.get('/:conversationId/resources/pinned-messages', getPinnedMessagesByConversationId)

router.get('/user/:userId', getConversationsByUser)


export default router