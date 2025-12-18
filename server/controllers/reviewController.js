const reviewService = require('../services/reviewService');

exports.getBreedReviews = async (req, res) => {
  try {
    const { breedId } = req.params;

    if (!breedId) {
      return res.status(400).json({ message: 'ID породы не указан' });
    }

    const reviews = await reviewService.getBreedReviews(breedId);
    res.status(200).json(reviews);
  } catch (err) {
    console.error('Ошибка при получении отзывов:', err);
    res.status(500).json({ message: err.message || 'Ошибка при получении отзывов' });
  }
};

exports.createBreedReview = async (req, res) => {
  try {
    const { breedId } = req.params;
    const { text, photos } = req.body;

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    if (!breedId) {
      return res.status(400).json({ message: 'ID породы не указан' });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Текст отзыва не может быть пустым' });
    }

    const review = await reviewService.createBreedReview(
      breedId,
      req.user.userId,
      text,
      photos
    );

    res.status(201).json(review);
  } catch (err) {
    console.error('Ошибка при создании отзыва:', err);
    res.status(400).json({ message: err.message || 'Ошибка при создании отзыва' });
  }
};

exports.toggleReviewReaction = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reaction } = req.body;

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    if (!reviewId) {
      return res.status(400).json({ message: 'ID отзыва не указан' });
    }

    if (!reaction) {
      return res.status(400).json({ message: 'Реакция не указана' });
    }

    const result = await reviewService.toggleReviewReaction(
      reviewId,
      req.user.userId,
      reaction
    );
    res.status(200).json(result);
  } catch (err) {
    console.error('Ошибка при изменении реакции:', err);
    res.status(400).json({ message: err.message || 'Ошибка при изменении реакции' });
  }
};

exports.getReviewReactions = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!reviewId) {
      return res.status(400).json({ message: 'ID отзыва не указан' });
    }

    const reactions = await reviewService.getReviewReactions(reviewId);
    res.status(200).json(reactions);
  } catch (err) {
    console.error('Ошибка при получении реакций:', err);
    res.status(500).json({ message: err.message || 'Ошибка при получении реакций' });
  }
};

