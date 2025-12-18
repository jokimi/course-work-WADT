const chatService = require('../services/chatService');

exports.getBreedChatMessages = async (req, res) => {
  try {
    const { breedId } = req.params;
    const { limit } = req.query;

    if (!breedId) {
      return res.status(400).json({ message: 'ID породы не указан' });
    }

    const messages = await chatService.getBreedChatMessages(breedId, limit ? parseInt(limit) : 50);
    res.status(200).json(messages);
  } catch (err) {
    console.error('Ошибка при получении сообщений чата:', err);
    res.status(500).json({ message: err.message || 'Ошибка при получении сообщений' });
  }
};

exports.createBreedChatMessage = async (req, res) => {
  try {
    const { breedId } = req.params;
    const { message, attachment } = req.body;

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    if (!breedId) {
      return res.status(400).json({ message: 'ID породы не указан' });
    }

    if ((!message || message.trim().length === 0) && !attachment) {
      return res.status(400).json({ message: 'Сообщение не может быть пустым' });
    }

    const chatMessage = await chatService.createBreedChatMessage(
      breedId,
      req.user.userId,
      message || '',
      attachment || null
    );

    res.status(201).json(chatMessage);
  } catch (err) {
    console.error('Ошибка при создании сообщения:', err);
    res.status(400).json({ message: err.message || 'Ошибка при создании сообщения' });
  }
};

exports.getBreedChatUsers = async (req, res) => {
  try {
    const { breedId } = req.params;

    if (!breedId) {
      return res.status(400).json({ message: 'ID породы не указан' });
    }

    const users = await chatService.getBreedChatUsers(breedId);
    res.status(200).json(users);
  } catch (err) {
    console.error('Ошибка при получении пользователей чата:', err);
    res.status(500).json({ message: err.message || 'Ошибка при получении пользователей' });
  }
};

exports.toggleReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reaction } = req.body;

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    if (!messageId) {
      return res.status(400).json({ message: 'ID сообщения не указан' });
    }

    if (!reaction) {
      return res.status(400).json({ message: 'Реакция не указана' });
    }

    const result = await chatService.toggleReaction(messageId, req.user.userId, reaction);
    res.status(200).json(result);
  } catch (err) {
    console.error('Ошибка при изменении реакции:', err);
    res.status(400).json({ message: err.message || 'Ошибка при изменении реакции' });
  }
};

exports.getMessageReactions = async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!messageId) {
      return res.status(400).json({ message: 'ID сообщения не указан' });
    }

    const reactions = await chatService.getMessageReactions(messageId);
    res.status(200).json(reactions);
  } catch (err) {
    console.error('Ошибка при получении реакций:', err);
    res.status(500).json({ message: err.message || 'Ошибка при получении реакций' });
  }
};

exports.uploadChatFile = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Файл не загружен' });
    }

    const file = req.file;
    const url = `/uploads/${file.filename}`;
    const isImage = file.mimetype.startsWith('image/');

    res.status(201).json({
      url,
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      isImage,
    });
  } catch (err) {
    console.error('Ошибка при загрузке файла для чата:', err);
    res.status(500).json({ message: err.message || 'Ошибка при загрузке файла' });
  }
};

exports.updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    if (!messageId) {
      return res.status(400).json({ message: 'ID сообщения не указан' });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Сообщение не может быть пустым' });
    }

    const updatedMessage = await chatService.updateBreedChatMessage(
      messageId,
      req.user.userId,
      message
    );

    res.status(200).json(updatedMessage);
  } catch (err) {
    console.error('Ошибка при обновлении сообщения:', err);
    res.status(400).json({ message: err.message || 'Ошибка при обновлении сообщения' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    if (!messageId) {
      return res.status(400).json({ message: 'ID сообщения не указан' });
    }

    const result = await chatService.deleteBreedChatMessage(
      messageId,
      req.user.userId
    );

    res.status(200).json(result);
  } catch (err) {
    console.error('Ошибка при удалении сообщения:', err);
    res.status(400).json({ message: err.message || 'Ошибка при удалении сообщения' });
  }
};

