import express from "express"
import { validate } from "../../middleware/validation.js";
import { userIdSchema } from "../../validators/userValidators.js";
import { conversationIdSchema } from "../../validators/conversationValidators.js";
import { getConversations, getConversationById, getConversationsByUser } from "../../controllers/chat/conversationController.js";
import { authenticate } from "../../middleware/authentication/authenticate.js";
import { authorizeConversation } from "../../middleware/authorization/conversation.js";

const router = express.Router();

router.get('/', getConversations)

router.get(
    '/user/:userId', 
    authenticate, // ✅ Check if user is logged in
    authorizeConversation, // ✅ Check if user is part of conversation
    validate(userIdSchema, 'params'), // ✅ Validate user ID format
    getConversationsByUser
)  

router.get('/:conversationId', 
    authenticate, // ✅ Check if user is logged in
    authorizeConversation, // ✅ Check if user is part of conversation
    validate(conversationIdSchema, 'params'), 
    getConversationById
)  


export default router