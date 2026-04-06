import Chat from '../models/Chat.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const chatUploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/chat/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const chatAttachmentUpload = multer({
  storage: chatUploadStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /pdf|doc|docx|ppt|pptx|xls|xlsx|txt|jpg|jpeg|png|gif|webp/;
    const extension = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype.toLowerCase();
    const isAllowedExtension = allowedExtensions.test(extension);
    const isAllowedMime =
      mimeType.startsWith('image/') ||
      mimeType.includes('pdf') ||
      mimeType.includes('word') ||
      mimeType.includes('officedocument') ||
      mimeType.includes('presentation') ||
      mimeType.includes('spreadsheet') ||
      mimeType.startsWith('text/');

    if (isAllowedExtension && isAllowedMime) {
      cb(null, true);
      return;
    }

    cb(new Error('Invalid file type. Only images and common document files are allowed.'));
  },
}).single('attachment');

const getComparableUserId = (value) => {
  if (!value) return '';
  if (typeof value === 'object' && value._id) {
    return value._id.toString();
  }
  return value.toString();
};

const dedupeMessages = (messages) => {
  const deduped = [];
  const seenByConversationKey = new Map();

  messages.forEach((msg) => {
    const currentTimestamp = new Date(msg.timestamp).getTime();
    const senderKey = getComparableUserId(msg.senderId);
    const receiverKey = getComparableUserId(msg.receiverId);
    const messageKey = `${senderKey}|${receiverKey}|${msg.message}`;
    const previousTimestamp = seenByConversationKey.get(messageKey);
    const isDuplicate =
      typeof previousTimestamp === 'number' &&
      Math.abs(currentTimestamp - previousTimestamp) < 5000;

    if (isDuplicate) return;

    seenByConversationKey.set(messageKey, currentTimestamp);
    deduped.push(msg);
  });

  return deduped;
};

const buildChatbotConversationContext = (history = []) => {
  if (!Array.isArray(history)) return '';

  return history
    .filter(
      (entry) =>
        entry &&
        typeof entry.message === 'string' &&
        entry.message.trim() &&
        (entry.role === 'user' || entry.role === 'assistant')
    )
    .slice(-12)
    .map((entry) => `${entry.role === 'assistant' ? 'AI Assistant' : 'Student'}: ${entry.message.trim()}`)
    .join('\n');
};

export const sendMessage = async (req, res) => {
  chatAttachmentUpload(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({ error: uploadError.message });
    }

    try {
      const { receiverId } = req.body;
      const message = (req.body.message || '').trim();

      if (!receiverId) {
        return res.status(400).json({ error: 'Receiver ID is required' });
      }

      if (!message && !req.file) {
        return res.status(400).json({ error: 'A message or attachment is required' });
      }

      const attachment = req.file
        ? {
            fileUrl: `/uploads/chat/${req.file.filename}`,
            fileName: req.file.originalname,
            fileType: path.extname(req.file.originalname).toLowerCase().replace('.', ''),
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
          }
        : null;

      const chatMessage = new Chat({
        senderId: req.userId,
        receiverId,
        message,
        attachment,
      });

      await chatMessage.save();
      await chatMessage.populate('senderId receiverId', 'name email');

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        chat: chatMessage,
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });
};

export const getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Chat.find({
      $or: [
        { senderId: req.userId, receiverId: userId },
        { senderId: userId, receiverId: req.userId },
      ],
    })
      .populate('senderId receiverId', 'name email avatar')
      .sort({ timestamp: 1 });

    res.json({ success: true, messages: dedupeMessages(messages) });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};

export const clearChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    await Chat.deleteMany({
      $or: [
        { senderId: req.userId, receiverId: userId },
        { senderId: userId, receiverId: req.userId },
      ],
    });

    res.json({ success: true, message: 'Chat history cleared successfully' });
  } catch (error) {
    console.error('Clear chat history error:', error);
    res.status(500).json({ error: error.message || 'Failed to clear chat history' });
  }
};

export const getChats = async (req, res) => {
  try {
    const messages = await Chat.find({
      $or: [{ senderId: req.userId }, { receiverId: req.userId }],
    });

    // Get unique users
    const uniqueUsers = new Set();
    const users = [];

    messages.forEach((msg) => {
      const otherUserId = msg.senderId.toString() === req.userId ? msg.receiverId : msg.senderId;
      if (!uniqueUsers.has(otherUserId.toString())) {
        uniqueUsers.add(otherUserId.toString());
        users.push(otherUserId);
      }
    });

    const populatedUsers = await Promise.all(
      users.map(async (userId) => {
        const user = await require('../models/User.js').default.findById(userId).select('_id name email avatar');
        return user;
      })
    );

    res.json({ success: true, users: populatedUsers });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
};

export const getChatbotResponse = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'your_google_api_key_here') {
      throw new Error('Google API key not configured');
    }

    const systemPrompt = `You are an AI assistant for a student doubt resolution system. Your role is to help students with their academic questions and doubts. 

Guidelines:
- Be helpful, patient, and encouraging
- Provide clear, accurate explanations for academic topics
- If a question is too complex or requires subject expertise, suggest consulting with a staff member
- Keep responses concise but informative
- Use simple language that students can understand
- For programming/code questions, provide examples when helpful
- Always maintain a positive and supportive tone

If you cannot adequately answer a question or if it requires personalized attention, recommend consulting with a qualified staff member.`;

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const conversationContext = buildChatbotConversationContext(history);
    const prompt = [
      systemPrompt,
      conversationContext ? `Conversation so far:\n${conversationContext}` : '',
      `Student: ${message.trim()}\nAI Assistant:`,
    ]
      .filter(Boolean)
      .join('\n\n');

    const result = await model.generateContent(prompt);

    const response = result.response.text();

    res.json({ success: true, response });
  } catch (error) {
    console.error('Chatbot error:', error);
    
    // Provide specific error messages based on error type
    let fallbackResponse = "I'm sorry, I'm having trouble connecting right now. I recommend consulting with a staff member for assistance with your question.";
    
    if (error.message === 'Google API key not configured') {
      fallbackResponse = "The AI assistant is not configured yet. Please consult with a staff member for assistance.";
    } else if (error.status === 401 || error.message.includes('API_KEY')) {
      fallbackResponse = "There seems to be an authentication issue with the AI service. Please try again later or consult with a staff member.";
    } else if (error.status === 429 || error.message.includes('quota')) {
      fallbackResponse = "The AI service is currently busy. Please try again in a moment or consult with a staff member.";
    } else if (error.status === 404 || error.status === 400) {
      fallbackResponse = "The configured AI model is unavailable. Please contact support or consult with a staff member.";
    }
    
    res.status(500).json({ 
      success: false, 
      response: fallbackResponse,
      error: 'AI service temporarily unavailable' 
    });
  }
};

export const getUnreadCounts = async (req, res) => {
  try {
    const unreadMessages = dedupeMessages(
      await Chat.find({
      receiverId: req.userId,
      read: false,
      }).sort({ timestamp: 1 })
    );

    const countsByUser = {};
    let total = 0;

    unreadMessages.forEach(msg => {
      const senderId = msg.senderId.toString();
      countsByUser[senderId] = (countsByUser[senderId] || 0) + 1;
      total += 1;
    });

    res.json({ success: true, total, countsByUser });
  } catch (error) {
    console.error('Get unread counts error:', error);
    res.status(500).json({ error: 'Failed to fetch unread counts' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { senderId } = req.params;

    await Chat.updateMany(
      { senderId, receiverId: req.userId, read: false },
      { $set: { read: true } }
    );

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};
