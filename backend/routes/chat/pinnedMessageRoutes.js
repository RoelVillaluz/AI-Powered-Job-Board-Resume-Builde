import express from "express";
import { getPinnedMessagesCountByConversationId, getPinnedMessagesByConversationId } from "../../controllers/chat/pinnedMessagesController.js";

const router = express.Router({ mergeParams: true });

router.get('/', getPinnedMessagesByConversationId)
router.get('/count', getPinnedMessagesCountByConversationId)

export default router