const articleService = require("../services/articleService");

exports.getArticles = async (req, res) => {
  try {
    const { page = 1, limit = 9, category } = req.query;
    const articles = await articleService.getArticles(page, limit, category);
    res.status(200).json(articles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getArticleById = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await articleService.getArticleById(id);
    res.status(200).json(article);
  } catch (error) {
    if (error.message === "Article not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.createArticle = async (req, res) => {
  try {
    const { title, content, categoryId, categoryIds } = req.body;
    let image = req.body.image;
    
    // Если есть загруженный файл изображения
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }
    
    // Обработка categoryIds из FormData (может быть массивом или строкой)
    let categoryIdsToUse;
    if (categoryIds) {
      // Если это массив из FormData (categoryIds[])
      categoryIdsToUse = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
    } else if (categoryId) {
      // Для обратной совместимости
      categoryIdsToUse = Array.isArray(categoryId) ? categoryId : [categoryId];
    } else {
      throw new Error("Необходимо указать хотя бы одну категорию");
    }
    
    const article = await articleService.createArticle(req.user.userId, title, content, categoryIdsToUse, image);
    res.status(201).json({ message: "Статья создана", article });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, categoryId, categoryIds } = req.body;
    let image = req.body.image;
    
    // Если есть загруженный файл изображения
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }
    
    // Обработка categoryIds из FormData (может быть массивом или строкой)
    let categoryIdsToUse;
    if (categoryIds !== undefined) {
      // Если это массив из FormData (categoryIds[])
      categoryIdsToUse = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
    } else if (categoryId !== undefined) {
      // Для обратной совместимости
      categoryIdsToUse = Array.isArray(categoryId) ? categoryId : [categoryId];
    } else {
      categoryIdsToUse = null; // Не обновлять категории
    }
    
    const article = await articleService.updateArticle(id, req.user.userId, title, content, categoryIdsToUse, image);
    res.status(200).json({ message: "Статья обновлена", article });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Логирование для отладки
    console.log(`🗑️ Удаление статьи ID: ${id}, пользователь ID: ${req.user.userId}, роль: ${req.user.role}, причина: ${reason || 'не указана'}`);
    
    await articleService.deleteArticle(id, req.user.userId, req.user.role, reason);
    res.status(200).json({ message: "Статья удалена" });
  } catch (err) {
    console.error('❌ Ошибка при удалении статьи:', err.message);
    res.status(400).json({ message: err.message });
  }
};

exports.saveArticle = async (req, res) => {
  try {
    const { articleId } = req.body;
    const savedArticle = await articleService.saveArticle(req.user.userId, articleId);
    res.status(201).json({ message: "Статья сохранена", savedArticle });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.unsaveArticle = async (req, res) => {
  try {
    const { id } = req.params;
    await articleService.unsaveArticle(req.user.userId, id);
    res.status(200).json({ message: "Статья удалена из сохраненных" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getSavedArticles = async (req, res) => {
  try {
    const savedArticles = await articleService.getSavedArticles(req.user.userId);
    res.status(200).json(savedArticles);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getArticleCategories = async (req, res) => {
  try {
    const categories = await articleService.getArticleCategories();
    res.status(200).json(categories);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.incrementArticleView = async (req, res) => {
  try {
    const { id } = req.params;
    await articleService.incrementArticleView(id);
    res.status(200).json({ message: "Просмотр засчитан" });
  } catch (error) {
    if (error.message === "Article not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};