import express from 'express'
import { getMessageById, getMessages, getMessagesByUser, createMessage, deleteMessage, updateMessage, markMessagesAsSeen } from '../controllers/messageController.js';

const router = express.Router();

router.get('/', getMessages)
router.get('/:messageId', getMessageById)
router.get('/user/:userId', getMessagesByUser)

router.post('/', createMessage)

router.patch('/:messageId', updateMessage)
router.patch('/mark-as-seen', markMessagesAsSeen)

router.delete('/:messageId', deleteMessage)

export default router