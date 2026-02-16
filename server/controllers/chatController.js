import Chat from '../models/Chat.js';

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;

    if (!receiverId || !message) {
      return res.status(400).json({ error: 'Receiver ID and message are required' });
    }

    const chatMessage = new Chat({
      senderId: req.userId,
      receiverId,
      message,
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

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
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
