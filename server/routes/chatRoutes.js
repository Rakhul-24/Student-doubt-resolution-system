import express from 'express';
import {
  sendMessage,
  getChatHistory,
  getChats,
} from '../controllers/chatController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send', authMiddleware, sendMessage);
router.get('/history/:userId', authMiddleware, getChatHistory);
router.get('/list', authMiddleware, getChats);

export default router;
