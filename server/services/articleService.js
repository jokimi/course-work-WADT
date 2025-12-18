const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getArticles = async (page, limit, category) => {
  const skip = (page - 1) * limit;

  let whereConditions = {};
  if (category) {
    whereConditions = {
      categories: {
        some: {
          categoryid: parseInt(category)
        }
      }
    };
  }

  const articles = await prisma.articles.findMany({
    where: whereConditions,
    skip,
    take: limit,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
        },
      },
      categories: {
        include: {
          category: true
        }
      },
    },
    orderBy: {
      createdat: 'desc',
    },
  });

  // Normalize categories data
  const normalizedArticles = articles.map(article => ({
    ...article,
    categories: article.categories.map(rel => ({
      id: rel.category.id,
      name: rel.category.categoryname
    })),
    // Для обратной совместимости - первая категория как основная
    category: article.categories.length > 0 ? {
      id: article.categories[0].category.id,
      name: article.categories[0].category.categoryname
    } : null
  }));

  const totalArticles = await prisma.articles.count({
    where: whereConditions,
  });

  return {
    articles: normalizedArticles,
    totalPages: Math.ceil(totalArticles / limit),
  };
};

exports.getArticleById = async (id) => {
  // Fetch the article without incrementing views
  const article = await prisma.articles.findUnique({
    where: { id: parseInt(id) },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
        },
      },
      categories: {
        include: {
          category: true
        }
      },
    },
  });

  if (!article) {
    throw new Error("Article not found");
  }

  // Normalize categories data
  const categories = article.categories.map(rel => ({
    id: rel.category.id,
    name: rel.category.categoryname
  }));

  return {
    ...article,
    categories,
    // Для обратной совместимости - первая категория как основная
    category: categories.length > 0 ? categories[0] : null
  };
};

exports.incrementArticleView = async (id) => {
  const article = await prisma.articles.findUnique({
    where: { id: parseInt(id) },
  });

  if (!article) {
    throw new Error("Article not found");
  }

  // Increment the views counter
  await prisma.articles.update({
    where: { id: parseInt(id) },
    data: {
      views: {
        increment: 1
      }
    }
  });
};

exports.createArticle = async (userId, title, content, categoryIds, image) => {
  // categoryIds может быть массивом или одним числом для обратной совместимости
  const categoryIdsArray = Array.isArray(categoryIds) 
    ? categoryIds.map(id => parseInt(id))
    : [parseInt(categoryIds)];

  const article = await prisma.articles.create({
    data: {
      authorid: parseInt(userId),
      title,
      content,
      image: image || null,
      createdat: new Date(),
      updatedat: new Date(),
      views: 0,
      categories: {
        create: categoryIdsArray.map(categoryId => ({
          categoryid: categoryId
        }))
      }
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
        },
      },
      categories: {
        include: {
          category: true
        }
      },
    },
  });

  // Normalize categories data
  const categories = article.categories.map(rel => ({
    id: rel.category.id,
    name: rel.category.categoryname
  }));

  return {
    ...article,
    categories,
    // Для обратной совместимости - первая категория как основная
    category: categories.length > 0 ? categories[0] : null
  };
};

exports.updateArticle = async (id, userId, title, content, categoryIds, image) => {
  const article = await prisma.articles.findUnique({
    where: { id: parseInt(id) },
  });

  if (!article) {
    throw new Error("Статья не найдена");
  }

  // Only the author can edit their article (admin cannot edit other users' articles)
  if (article.authorid !== userId) {
    throw new Error("Доступ запрещен. Только автор может редактировать свою статью");
  }

  // categoryIds может быть массивом или одним числом для обратной совместимости
  const categoryIdsArray = categoryIds 
    ? (Array.isArray(categoryIds) 
        ? categoryIds.map(cid => parseInt(cid))
        : [parseInt(categoryIds)])
    : null;

  const updateData = {
    title,
    content,
    updatedat: new Date()
  };

  // Only update image if it's provided
  if (image !== undefined) {
    updateData.image = image || null;
  }

  // Если указаны категории, обновляем их
  if (categoryIdsArray) {
    // Удаляем старые связи
    await prisma.article_category_relations.deleteMany({
      where: { articleid: parseInt(id) }
    });
    
    // Добавляем новые связи
    updateData.categories = {
      create: categoryIdsArray.map(categoryId => ({
        categoryid: categoryId
      }))
    };
  }

  const updatedArticle = await prisma.articles.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
        },
      },
      categories: {
        include: {
          category: true
        }
      },
    },
  });

  // Normalize categories data
  const categories = updatedArticle.categories.map(rel => ({
    id: rel.category.id,
    name: rel.category.categoryname
  }));

  return {
    ...updatedArticle,
    categories,
    // Для обратной совместимости - первая категория как основная
    category: categories.length > 0 ? categories[0] : null
  };
};

exports.deleteArticle = async (id, userId, userRole, reason = null) => {
  const article = await prisma.articles.findUnique({
    where: { id: parseInt(id) },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          telegram_chat_id: true,
        }
      }
    }
  });

  if (!article) {
    throw new Error("Статья не найдена");
  }

  // Only author can delete their article, or admin can delete any article
  if (article.authorid !== userId && userRole !== 'admin') {
    throw new Error("Доступ запрещен. Только автор может удалить свою статью");
  }

  // Если админ удаляет чужую статью и указана причина, отправляем уведомление
  if (userRole === 'admin' && article.authorid !== userId && reason) {
    const telegramService = require('./telegramService');
    const chatId = article.author.telegram_chat_id;
    
    if (chatId && telegramService.isBotAvailable()) {
      try {
        // Преобразуем chatId в строку, если это число
        const chatIdString = String(chatId);
        
        const message = `⚠️ *Ваша статья была удалена*\n\n` +
          `*Название статьи:* ${article.title}\n` +
          `*Причина удаления:* ${reason}\n\n` +
          `Если у вас есть вопросы, обратитесь к администрации.`;
        
        const sent = await telegramService.sendMessage(chatIdString, message);
        if (sent) {
          console.log(`✅ Уведомление об удалении статьи отправлено пользователю ${article.author.name} (chatId: ${chatIdString})`);
        } else {
          console.warn(`⚠️ Не удалось отправить уведомление пользователю ${article.author.name} (chatId: ${chatIdString})`);
        }
      } catch (error) {
        console.error('Ошибка при отправке уведомления в Telegram:', error);
        console.error('Детали ошибки:', error.response?.body || error.message);
        // Не прерываем удаление статьи, если уведомление не отправилось
      }
    } else if (!chatId) {
      console.warn(`⚠️ У пользователя ${article.author.name} не указан Telegram Chat ID. Уведомление не будет отправлено.`);
    } else if (!telegramService.isBotAvailable()) {
      console.warn(`⚠️ Telegram бот недоступен. Уведомление не будет отправлено.`);
    }
  }

  // Delete related saved articles first
  await prisma.saved_articles.deleteMany({
    where: { articleid: parseInt(id) },
  });

  await prisma.articles.delete({
    where: { id: parseInt(id) },
  });
};

exports.saveArticle = async (userId, articleId) => {
  const existingSave = await prisma.saved_articles.findFirst({
    where: {
      userid: userId,
      articleid: parseInt(articleId),
    },
  });

  if (existingSave) {
    throw new Error("Статья уже сохранена");
  }

  const savedArticle = await prisma.saved_articles.create({
    data: {
      userid: userId,
      articleid: parseInt(articleId),
    },
    include: {
      article: {
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
          categories: {
            include: {
              category: true
            }
          },
        },
      },
    },
  });

  // Normalize categories data
  const categories = savedArticle.article.categories.map(rel => ({
    id: rel.category.id,
    name: rel.category.categoryname
  }));
  
  return {
    ...savedArticle,
    article: {
      ...savedArticle.article,
      categories,
      category: categories.length > 0 ? categories[0] : null
    }
  };
};

exports.unsaveArticle = async (userId, articleId) => {
  const savedArticle = await prisma.saved_articles.findFirst({
    where: {
      userid: userId,
      articleid: parseInt(articleId),
    },
  });

  if (!savedArticle) {
    throw new Error("Статья не найдена в сохраненных");
  }

  await prisma.saved_articles.delete({
    where: { id: savedArticle.id },
  });
};

exports.getSavedArticles = async (userId) => {
  const savedArticles = await prisma.saved_articles.findMany({
    where: { userid: userId },
    include: {
      article: {
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
          categories: {
            include: {
              category: true
            }
          },
        },
      },
    },
    orderBy: {
      article: {
        createdat: 'desc',
      },
    },
  });

  // Normalize category data to use 'name' instead of 'categoryname'
  return savedArticles.map(savedArticle => {
    const categories = savedArticle.article.categories.map(rel => ({
      id: rel.category.id,
      name: rel.category.categoryname
    }));

    return {
      ...savedArticle,
      article: {
        ...savedArticle.article,
        categories: categories,
        // Для обратимой совместимости - первая категория как основная
        category: categories.length > 0 ? { ...categories[0] } : null
      }
    };
  });
};

exports.getArticleCategories = async () => {
  const categories = await prisma.article_categories.findMany();
  // Normalize category data to use 'name' instead of 'categoryname'
  return categories.map(category => ({
    ...category,
    name: category.categoryname
  }));
};