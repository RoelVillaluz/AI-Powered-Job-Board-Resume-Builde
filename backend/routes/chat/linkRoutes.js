import express from "express"
import { getLinkCountsByConversationId, getLinksByConversationId } from "../../controllers/chat/linksController.js"
import { authenticate } from "../../middleware/authentication/authenticate.js";
import { conversationIdSchema } from "../../validators/conversationValidators.js";
import { authorizeConversation } from "../../middleware/authorization/conversation.js";
import { validate } from "../../middleware/validation.js";

const router = express.Router({ mergeParams: true });

router.get('/', 
    authenticate,
    validate(conversationIdSchema, 'params'),
    authorizeConversation,
    getLinksByConversationId
)

router.get('/count', 
    authenticate,
    validate(conversationIdSchema, 'params'),
    authorizeConversation,
    getLinkCountsByConversationId
)

export default router