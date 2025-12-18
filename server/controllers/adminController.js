const adminService = require("../services/adminService");

const parseBoolean = (value) =>
  value === true || value === "true" || value === "1" || value === 1 || value === "True";

const handleControllerError = (res, error, defaultMessage = "Ошибка сервера") => {
  const status = error.status || 500;
  res.status(status).json({ message: error.message || defaultMessage });
};

// Species Management
exports.addSpecies = async (req, res) => {
  try {
    const speciesData = { ...req.body };

    if (req.file) {
      speciesData.icon = `/uploads/${req.file.filename}`;
    }

    const newSpecies = await adminService.addSpecies(speciesData);
    res.status(201).json(newSpecies);
  } catch (error) {
    handleControllerError(res, error, "Не удалось добавить вид");
  }
};

exports.updateSpecies = async (req, res) => {
  try {
    const { id } = req.params;
    const speciesData = { ...req.body };

    if (speciesData.removeIcon !== undefined) {
      speciesData.removeIcon = parseBoolean(speciesData.removeIcon);
    }

    if (speciesData.removeIcon && req.file) {
      return res
        .status(400)
        .json({ message: "Нельзя одновременно загрузить новое фото и удалить старое" });
    }

    if (req.file) {
      speciesData.icon = `/uploads/${req.file.filename}`;
    }

    const updatedSpecies = await adminService.updateSpecies(id, speciesData);
    res.status(200).json(updatedSpecies);
  } catch (error) {
    handleControllerError(res, error, "Не удалось обновить вид");
  }
};

exports.deleteSpecies = async (req, res) => {
  try {
    const { id } = req.params;
    await adminService.deleteSpecies(id);
    res.status(200).json({ message: "Вид удален успешно" });
  } catch (error) {
    handleControllerError(res, error, "Не удалось удалить вид");
  }
};

// Breed Management
exports.addBreed = async (req, res) => {
  try {
    const breedData = { ...req.body };

    if (breedData.hypoallergenicity !== undefined) {
      breedData.hypoallergenicity = parseBoolean(breedData.hypoallergenicity);
    }

    if (req.file) {
      breedData.photo = `/uploads/${req.file.filename}`;
    }

    const newBreed = await adminService.addBreed(breedData);
    res.status(201).json(newBreed);
  } catch (error) {
    handleControllerError(res, error, "Не удалось добавить породу");
  }
};

exports.updateBreed = async (req, res) => {
  try {
    const { id } = req.params;
    const breedData = { ...req.body };

    if (breedData.hypoallergenicity !== undefined) {
      breedData.hypoallergenicity = parseBoolean(breedData.hypoallergenicity);
    }

    if (req.file) {
      breedData.photo = `/uploads/${req.file.filename}`;
    }

    const updatedBreed = await adminService.updateBreed(id, breedData);
    res.status(200).json(updatedBreed);
  } catch (error) {
    handleControllerError(res, error, "Не удалось обновить породу");
  }
};

exports.deleteBreed = async (req, res) => {
  try {
    const { id } = req.params;
    await adminService.deleteBreed(id);
    res.status(200).json({ message: "Порода удалена успешно" });
  } catch (error) {
    handleControllerError(res, error, "Не удалось удалить породу");
  }
};

// Article Category Management
exports.addArticleCategory = async (req, res) => {
  try {
    const categoryData = req.body;
    const newCategory = await adminService.addArticleCategory(categoryData);
    res.status(201).json(newCategory);
  } catch (error) {
    handleControllerError(res, error, "Не удалось добавить категорию");
  }
};

exports.updateArticleCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const categoryData = req.body;
    const updatedCategory = await adminService.updateArticleCategory(id, categoryData);
    res.status(200).json(updatedCategory);
  } catch (error) {
    handleControllerError(res, error, "Не удалось обновить категорию");
  }
};

exports.deleteArticleCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await adminService.deleteArticleCategory(id);
    res.status(200).json({ message: "Категория удалена успешно" });
  } catch (error) {
    handleControllerError(res, error, "Не удалось удалить категорию");
  }
};

// Article Management
exports.deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    await adminService.deleteArticle(id);
    res.status(200).json({ message: "Статья удалена успешно" });
  } catch (error) {
    handleControllerError(res, error, "Не удалось удалить статью");
  }
};

// Reminder Types Management
exports.addReminderType = async (req, res) => {
  try {
    const typeData = req.body;
    const newType = await adminService.addReminderType(typeData);
    res.status(201).json(newType);
  } catch (error) {
    handleControllerError(res, error, "Не удалось добавить тип напоминания");
  }
};

exports.getReminderTypes = async (req, res) => {
  try {
    const types = await adminService.getReminderTypes();
    res.status(200).json(types);
  } catch (error) {
    handleControllerError(res, error, "Не удалось загрузить типы напоминаний");
  }
};

exports.updateReminderType = async (req, res) => {
  try {
    const { id } = req.params;
    const typeData = req.body;
    const updatedType = await adminService.updateReminderType(id, typeData);
    res.status(200).json(updatedType);
  } catch (error) {
    handleControllerError(res, error, "Не удалось обновить тип напоминания");
  }
};

exports.deleteReminderType = async (req, res) => {
  try {
    const { id } = req.params;
    await adminService.deleteReminderType(id);
    res.status(200).json({ message: "Тип напоминания успешно удален" });
  } catch (error) {
    handleControllerError(res, error, "Не удалось удалить тип напоминания");
  }
};