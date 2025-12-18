const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getBreedReviews = async (breedId) => {
  const reviews = await prisma.breed_reviews.findMany({
    where: {
      breedid: parseInt(breedId),
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      createdat: 'desc',
    },
  });

  return reviews;
};

exports.createBreedReview = async (breedId, userId, text, photos = null) => {
  // Разрешаем отзывы без текста, если есть фото
  const hasText = text && text.trim().length > 0;
  const hasPhotos = photos && (typeof photos === 'string' ? photos.trim().length > 0 : photos.length > 0);
  
  if (!hasText && !hasPhotos) {
    throw new Error('Отзыв должен содержать текст или фотографию');
  }

  if (hasText && text.length > 2000) {
    throw new Error('Отзыв слишком длинный (максимум 2000 символов)');
  }

  const photosJson = photos ? (typeof photos === 'string' ? photos : JSON.stringify(photos)) : null;

  const review = await prisma.breed_reviews.create({
    data: {
      breedid: parseInt(breedId),
      userid: parseInt(userId),
      text: hasText ? text.trim() : '',
      photos: photosJson,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  return review;
};

exports.toggleReviewReaction = async (reviewId, userId, reaction) => {
  const existingReaction = await prisma.breed_review_reactions.findUnique({
    where: {
      reviewid_userid_reaction: {
        reviewid: parseInt(reviewId),
        userid: parseInt(userId),
        reaction: reaction,
      },
    },
  });

  if (existingReaction) {
    await prisma.breed_review_reactions.delete({
      where: {
        id: existingReaction.id,
      },
    });
    return { action: 'removed', reaction: null };
  } else {
    await prisma.breed_review_reactions.deleteMany({
      where: {
        reviewid: parseInt(reviewId),
        userid: parseInt(userId),
      },
    });

    const newReaction = await prisma.breed_review_reactions.create({
      data: {
        reviewid: parseInt(reviewId),
        userid: parseInt(userId),
        reaction: reaction,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return { action: 'added', reaction: newReaction };
  }
};

exports.getReviewReactions = async (reviewId) => {
  const reactions = await prisma.breed_review_reactions.findMany({
    where: {
      reviewid: parseInt(reviewId),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const grouped = {};
  reactions.forEach(reaction => {
    if (!grouped[reaction.reaction]) {
      grouped[reaction.reaction] = [];
    }
    grouped[reaction.reaction].push(reaction.user);
  });

  return grouped;
};

exports.updateBreedReview = async (reviewId, userId, text, photos = null) => {
  // Проверяем, что отзыв существует и принадлежит пользователю
  const review = await prisma.breed_reviews.findUnique({
    where: { id: parseInt(reviewId) },
  });

  if (!review) {
    throw new Error('Отзыв не найден');
  }

  if (review.userid !== parseInt(userId)) {
    throw new Error('Вы можете редактировать только свои отзывы');
  }

  // Разрешаем отзывы без текста, если есть фото
  const hasText = text && text.trim().length > 0;
  const hasPhotos = photos && (typeof photos === 'string' ? photos.trim().length > 0 : photos.length > 0);
  
  if (!hasText && !hasPhotos) {
    throw new Error('Отзыв должен содержать текст или фотографию');
  }

  if (hasText && text.length > 2000) {
    throw new Error('Отзыв слишком длинный (максимум 2000 символов)');
  }

  const photosJson = photos ? (typeof photos === 'string' ? photos : JSON.stringify(photos)) : null;

  const updatedReview = await prisma.breed_reviews.update({
    where: { id: parseInt(reviewId) },
    data: {
      text: hasText ? text.trim() : '',
      photos: photosJson,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  return updatedReview;
};

exports.deleteBreedReview = async (reviewId, userId) => {
  // Проверяем, что отзыв существует и принадлежит пользователю
  const review = await prisma.breed_reviews.findUnique({
    where: { id: parseInt(reviewId) },
    select: { userid: true, breedid: true },
  });

  if (!review) {
    throw new Error('Отзыв не найден');
  }

  if (review.userid !== parseInt(userId)) {
    throw new Error('Вы можете удалять только свои отзывы');
  }

  await prisma.breed_reviews.delete({
    where: { id: parseInt(reviewId) },
  });

  return { reviewId: parseInt(reviewId), breedId: review.breedid };
};

