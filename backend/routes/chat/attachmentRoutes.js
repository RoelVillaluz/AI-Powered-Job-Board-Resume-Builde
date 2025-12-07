import express from "express";
import { getAttachmentCountsByConversationId, getAttachmentsByConversationId } from "../../controllers/chat/attachmentsController.js";

const router = express.Router({ mergeParams: true });

router.get('/', getAttachmentsByConversationId)
router.get('/count', getAttachmentCountsByConversationId)

export default router