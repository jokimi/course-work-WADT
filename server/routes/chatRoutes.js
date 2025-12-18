const express = require('express');
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/authMiddleware');
const chatUpload = require('../middleware/chatUpload');

const router = express.Router();

router.get('/breeds/:breedId/messages', authenticateToken, chatController.getBreedChatMessages);
router.post('/breeds/:breedId/messages', authenticateToken, chatController.createBreedChatMessage);
router.get('/breeds/:breedId/users', authenticateToken, chatController.getBreedChatUsers);
router.post('/messages/:messageId/reaction', authenticateToken, chatController.toggleReaction);
router.get('/messages/:messageId/reactions', authenticateToken, chatController.getMessageReactions);
router.put('/messages/:messageId', authenticateToken, chatController.updateMessage);
router.delete('/messages/:messageId', authenticateToken, chatController.deleteMessage);
router.post('/upload', authenticateToken, chatUpload.single('file'), chatController.uploadChatFile);

module.exports = router;

