import express from "express"
import { getLinkCountsByConversationId, getLinksByConversationId } from "../../controllers/chat/linksController.js"

const router = express.Router({ mergeParams: true });

router.get('/', getLinksByConversationId)
router.get('/count', getLinkCountsByConversationId)

export default router