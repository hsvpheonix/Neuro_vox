require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/database');
const routes = require('./routes/index');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// ─── Socket.io Setup ──────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Join user-specific room
  socket.on('join_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Real-time brain signal streaming
  socket.on('brain_signal_stream', (data) => {
    // Broadcast to doctor/caregiver rooms
    socket.broadcast.emit('brain_signal_update', data);
  });

  // Emergency broadcast
  socket.on('emergency', (data) => {
    io.emit('emergency_alert', data);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});
app.use('/api/', limiter);

// Auth rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts. Please try again later.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Static files (uploaded media)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api', routes);

// Root
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🧠 NeuroVox API - Transforming Silence Into Hope',
    version: '1.0.0',
    docs: '/api/health',
    endpoints: {
      auth: '/api/auth',
      brain: '/api/brain',
      emergency: '/api/emergency',
      mindlog: '/api/mindlog',
      appointments: '/api/appointments',
      therapy: '/api/therapy',
      reports: '/api/reports',
      technician: '/api/technician',
      resources: '/api/resources',
      doctor: '/api/doctor',
      dashboard: '/api/dashboard',
      users: '/api/users',
      chatbot: '/api/chatbot'
    }
  });
});

// ─── Error Handling ────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 NeuroVox Server running on port ${PORT}`);
  console.log(`🌐 API Base: http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

module.exports = { app, server, io };
