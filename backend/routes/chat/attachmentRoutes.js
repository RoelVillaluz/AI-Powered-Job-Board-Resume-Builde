import express from "express";
import { getAttachmentCountsByConversationId, getAttachmentsByConversationId } from "../../controllers/chat/attachmentsController.js";
import { authenticate } from "../../middleware/authentication/authenticate.js";
import { conversationIdSchema } from "../../validators/conversationValidators.js";
import { authorizeConversation } from "../../middleware/authorization/conversation.js";
import { validate } from "../../middleware/validation.js";

const router = express.Router({ mergeParams: true });

router.get('/', 
    authenticate,
    validate(conversationIdSchema, 'params'),
    authorizeConversation,
    getAttachmentsByConversationId
)

router.get('/count', 
    authenticate,
    validate(conversationIdSchema, 'params'),
    authorizeConversation,
    getAttachmentCountsByConversationId
)

export default router