import express from "express";
import { validate } from "../../middleware/validation.js";
import { userIdSchema } from "../../validators/userValidators.js";
import { conversationIdSchema } from "../../validators/conversationValidators.js";
import { getConversations, getConversationById, getConversationsByUser } from "../../controllers/chat/conversationController.js";
import { authenticate } from "../../middleware/authentication/authenticate.js";
import { authorizeConversation, authorizeConversationByUserId } from "../../middleware/authorization/conversation.js";

const router = express.Router();

router.get('/', getConversations);

router.get(
    '/user/:userId',
    authenticate,                          // 1. Check if logged in
    validate(userIdSchema, 'params'),      // 2. Validate userId format
    authorizeConversationByUserId,         // 3. Check if user can access this data
    getConversationsByUser
);

router.get(
    '/:conversationId',
    authenticate,                          // 1. Check if logged in
    validate(conversationIdSchema, 'params'), // 2. Validate conversationId format
    authorizeConversation,                 // 3. Check if user is participant
    getConversationById
);

export default router;