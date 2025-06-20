import express from 'express'
import { getMessageById, getMessages, getMessagesByUser, createMessage, deleteMessage } from '../controllers/messageController.js';

const router = express.Router();

router.get('/', getMessages)
router.get('/:messageId', getMessageById)
router.get('/user/:userId', getMessagesByUser)

router.post('/', createMessage)

router.delete('/:messageId', deleteMessage)

export default router