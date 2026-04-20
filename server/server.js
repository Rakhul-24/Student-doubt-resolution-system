import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/authRoutes.js';
import slotRoutes from './routes/slotRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
import doubtRoutes from './routes/doubtRoutes.js';

// Import Socket.io handler
import { handleSocketConnection } from './socket.js';

// Initialize Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/student-doubt-resolution';

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('✓ MongoDB Connected'))
  .catch((err) => console.error('✗ MongoDB Connection Error:', err));

// Socket.io Connection
io.on('connection', (socket) => {
  handleSocketConnection(socket, io);
});

// Make io available in routes via app
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/doubts', doubtRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});