import express from 'express'
import { getMessageById, getMessages, getMessagesByUser, createMessage, deleteMessage, updateMessage, markMessagesAsSeen } from '../controllers/messageController.js';
import multer from "multer"
import path from "path";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'frontend/public/message_attachments')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
})

const upload = multer({ storage: storage })

const router = express.Router();

router.get('/', getMessages)
router.get('/:messageId', getMessageById)
router.get('/user/:userId', getMessagesByUser)

router.post('/', upload.single('attachment'), createMessage)

router.patch('/mark-as-seen', markMessagesAsSeen)
router.patch('/:messageId', updateMessage)

router.delete('/:messageId', deleteMessage)

export default router