const express = require("express");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cron = require("node-cron");
const authRoutes = require("./routes/authRoutes");
const petRoutes = require("./routes/petRoutes");
const articleRoutes = require("./routes/articleRoutes");
const breedRequestRoutes = require("./routes/breedRequestRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const chatRoutes = require("./routes/chatRoutes");
const reminderNotificationService = require("./services/reminderNotificationService");
const http = require('http');
const { Server } = require('socket.io');

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "middleware/uploads")));

// Basic route for testing
app.get("/", (req, res) => {
  res.json({
    message: "Pet Tracker API is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: "/api/auth",
      pets: "/api/pets",
      articles: "/api/articles",
      users: "/api/user",
      admin: "/api/admin",
      breedRequests: "/api/breed-requests"
    }
  });
});

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "Pet Tracker API"
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/breed-requests", breedRequestRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Запуск сервера
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Настройка Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.IO для чата
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";
    const decoded = jwt.verify(token, SECRET_KEY);
    socket.userId = decoded.userId;
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`Пользователь подключен: ${socket.userId}`);

  socket.on('join-breed-chat', (breedId) => {
    socket.join(`breed-${breedId}`);
    console.log(`Пользователь ${socket.userId} присоединился к чату породы ${breedId}`);
  });

  socket.on('leave-breed-chat', (breedId) => {
    socket.leave(`breed-${breedId}`);
    console.log(`Пользователь ${socket.userId} покинул чат породы ${breedId}`);
  });

  socket.on('send-message', async (data) => {
    try {
      const { breedId, message, attachments } = data;
      const chatService = require('./services/chatService');
      
      const chatMessage = await chatService.createBreedChatMessage(
        breedId,
        socket.userId,
        message,
        attachments || null
      );

      // Отправляем сообщение всем в комнате
      io.to(`breed-${breedId}`).emit('new-message', chatMessage);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('toggle-reaction', async (data) => {
    try {
      const { messageId, reaction } = data;
      const chatService = require('./services/chatService');
      const { PrismaClient } = require('@prisma/client');
      const prismaInstance = new PrismaClient();
      
      const result = await chatService.toggleReaction(
        messageId,
        socket.userId,
        reaction
      );

      // Получаем обновленные реакции для сообщения
      const reactions = await chatService.getMessageReactions(messageId);

      // Получаем breedId сообщения
      const message = await prismaInstance.breed_chat_messages.findUnique({
        where: { id: parseInt(messageId) },
        select: { breedid: true },
      });

      if (message) {
        // Отправляем обновление всем в комнате породы
        io.to(`breed-${message.breedid}`).emit('reaction-updated', {
          messageId: parseInt(messageId),
          reactions: reactions,
          action: result.action,
        });
      }

      await prismaInstance.$disconnect();
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('update-message', async (data) => {
    try {
      const { messageId, message } = data;
      const chatService = require('./services/chatService');
      const { PrismaClient } = require('@prisma/client');
      const prismaInstance = new PrismaClient();
      
      const updatedMessage = await chatService.updateBreedChatMessage(
        messageId,
        socket.userId,
        message
      );

      // Получаем breedId сообщения
      const originalMessage = await prismaInstance.breed_chat_messages.findUnique({
        where: { id: parseInt(messageId) },
        select: { breedid: true },
      });

      if (originalMessage) {
        // Отправляем обновленное сообщение всем в комнате породы
        io.to(`breed-${originalMessage.breedid}`).emit('message-updated', updatedMessage);
      }

      await prismaInstance.$disconnect();
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('delete-message', async (data) => {
    try {
      const { messageId } = data;
      const chatService = require('./services/chatService');
      const { PrismaClient } = require('@prisma/client');
      const prismaInstance = new PrismaClient();
      
      // Получаем breedId сообщения перед удалением
      const message = await prismaInstance.breed_chat_messages.findUnique({
        where: { id: parseInt(messageId) },
        select: { breedid: true },
      });

      await chatService.deleteBreedChatMessage(
        messageId,
        socket.userId
      );

      if (message) {
        // Отправляем событие удаления всем в комнате породы
        io.to(`breed-${message.breedid}`).emit('message-deleted', {
          messageId: parseInt(messageId),
        });
      }

      await prismaInstance.$disconnect();
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('join-breed-reviews', (breedId) => {
    socket.join(`breed-reviews-${breedId}`);
    console.log(`Пользователь ${socket.userId} присоединился к отзывам породы ${breedId}`);
  });

  socket.on('leave-breed-reviews', (breedId) => {
    socket.leave(`breed-reviews-${breedId}`);
    console.log(`Пользователь ${socket.userId} покинул отзывы породы ${breedId}`);
  });

  socket.on('create-review', async (data) => {
    try {
      const { breedId, text, photos } = data;
      const reviewService = require('./services/reviewService');
      
      const review = await reviewService.createBreedReview(
        breedId,
        socket.userId,
        text,
        photos
      );

      io.to(`breed-reviews-${breedId}`).emit('new-review', review);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('toggle-review-reaction', async (data) => {
    try {
      const { reviewId, reaction } = data;
      const reviewService = require('./services/reviewService');
      const { PrismaClient } = require('@prisma/client');
      const prismaInstance = new PrismaClient();
      
      const result = await reviewService.toggleReviewReaction(
        reviewId,
        socket.userId,
        reaction
      );

      const reactions = await reviewService.getReviewReactions(reviewId);

      const review = await prismaInstance.breed_reviews.findUnique({
        where: { id: parseInt(reviewId) },
        select: { breedid: true },
      });

      if (review) {
        io.to(`breed-reviews-${review.breedid}`).emit('review-reaction-updated', {
          reviewId: parseInt(reviewId),
          reactions: reactions,
          action: result.action,
        });
      }

      await prismaInstance.$disconnect();
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('update-review', async (data) => {
    try {
      const { reviewId, text, photos } = data;
      const reviewService = require('./services/reviewService');
      const { PrismaClient } = require('@prisma/client');
      const prismaInstance = new PrismaClient();
      
      const updatedReview = await reviewService.updateBreedReview(
        reviewId,
        socket.userId,
        text,
        photos
      );

      const review = await prismaInstance.breed_reviews.findUnique({
        where: { id: parseInt(reviewId) },
        select: { breedid: true },
      });

      if (review) {
        io.to(`breed-reviews-${review.breedid}`).emit('review-updated', updatedReview);
      }

      await prismaInstance.$disconnect();
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('delete-review', async (data) => {
    try {
      const { reviewId } = data;
      const reviewService = require('./services/reviewService');
      
      const result = await reviewService.deleteBreedReview(reviewId, socket.userId);

      io.to(`breed-reviews-${result.breedId}`).emit('review-deleted', {
        reviewId: parseInt(reviewId),
      });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Пользователь отключен: ${socket.userId}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}/api`);
  console.log(`💬 Socket.IO server ready`);
  
  // Запускаем cron job для проверки напоминаний каждую минуту
  // Проверяем предстоящие напоминания
  cron.schedule('* * * * *', async () => {
    try {
      const result = await reminderNotificationService.checkAndSendReminders();
      if (result.total > 0) {
        console.log(`📊 Найдено напоминаний: ${result.total}, отправлено: ${result.sentCount}, ошибок: ${result.failedCount}`);
      }
    } catch (error) {
      console.error('Ошибка в cron job для проверки напоминаний:', error);
    }
  });
  
  console.log('⏰ Cron job для проверки напоминаний запущен (каждую минуту)');
});

// Экспортируем io для использования в других модулях
module.exports = { io };