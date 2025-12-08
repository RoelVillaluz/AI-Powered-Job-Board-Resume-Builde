import express from "express"
import { validate } from "../../middleware/validation.js";
import { userIdSchema } from "../../validators/userValidators.js";
import { conversationIdSchema } from "../../validators/conversationValidators.js";

import { getConversations, getConversationById, getConversationsByUser } from "../../controllers/chat/conversationController.js";

const router = express.Router();

router.get('/', getConversations)
router.get('/user/:userId', validate(userIdSchema, 'params'), getConversationsByUser)  
router.get('/:conversationId', validate(conversationIdSchema, 'params'), getConversationById)  


export default router