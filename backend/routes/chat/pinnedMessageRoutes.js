import express from "express";
import { getPinnedMessagesCountByConversationId, getPinnedMessagesByConversationId } from "../../controllers/chat/pinnedMessagesController.js";
import { authenticate } from "../../middleware/authentication/authenticate.js";
import { conversationIdSchema } from "../../validators/conversationValidators.js";
import { authorizeConversation } from "../../middleware/authorization/conversation.js";
import { validate } from "../../middleware/validation.js";

const router = express.Router({ mergeParams: true });

router.get('/', 
    authenticate,
    validate(conversationIdSchema, 'params'),
    authorizeConversation,
    getPinnedMessagesByConversationId
)

router.get('/count', 
    authenticate,
    validate(conversationIdSchema, 'params'),
    authorizeConversation,
    getPinnedMessagesCountByConversationId
)

export default router