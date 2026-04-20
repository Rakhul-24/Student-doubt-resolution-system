const userSockets = {}; // Map to store user socket connections

export const handleSocketConnection = (socket, io) => {
  console.log(`✓ User connected: ${socket.id}`);

  // Handle user join
  socket.on('user_join', (userId) => {
    if (!userId) return;
    const uid = String(userId);
    userSockets[uid] = socket.id;
    socket.join(uid);
    io.emit('user_online', { userId: uid, status: 'online' });
  });

  // Handle sending message
  socket.on('send_message', async (data) => {
    try {
      const { senderId, receiverId, message, attachment, timestamp, _id } = data;
      const messagePayload = {
        _id,
        senderId,
        receiverId,
        message,
        attachment: attachment || null,
        timestamp: timestamp || new Date().toISOString(),
      };

      const rid = String(receiverId);
      // Emit to receiver
      io.to(rid).emit('receive_message', messagePayload);
      if (userSockets[rid]) {
        io.to(userSockets[rid]).emit('receive_message', messagePayload);
      }

      // Emit confirmation to sender without re-persisting the message.
      socket.emit('message_sent', messagePayload);
    } catch (error) {
      console.error('Socket error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log(`✗ User disconnected: ${socket.id}`);
    for (let userId in userSockets) {
      if (userSockets[userId] === socket.id) {
        delete userSockets[userId];
        io.emit('user_offline', { userId, status: 'offline' });
        break;
      }
    }
  });

  // Handle typing indicator
  socket.on('user_typing', (data) => {
    const { senderId, receiverId } = data;
    const rid = String(receiverId);
    const receiverSocketId = userSockets[rid];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing_status', { senderId });
    }
  });

  // Handle stop typing
  socket.on('user_stop_typing', (data) => {
    const { senderId, receiverId } = data;
    const rid = String(receiverId);
    const receiverSocketId = userSockets[rid];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_stop_typing_status', { senderId });
    }
  });
};
