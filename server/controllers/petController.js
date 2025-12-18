const petService = require("../services/petService");

exports.getSpecies = async (req, res) => {
  try {
    const species = await petService.getSpecies();
    res.status(200).json(species);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllBreeds = async (req, res) => {
  try {
    const breeds = await petService.getAllBreeds();
    res.status(200).json(breeds);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBreeds = async (req, res) => {
  try {
    const { page = 1, limit = 9, species, hypoallergenic, lifespan, size } = req.query;

    const filters = {
      species: species ? species.split(",") : [],
      hypoallergenic: hypoallergenic ? hypoallergenic === "true" : undefined,
      lifespan: lifespan ? lifespan.split(",") : [],
      size: size ? size.split(",") : []
    };

    const breeds = await petService.getBreedsWithFilters(page, limit, filters);
    res.status(200).json(breeds);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBreedById = async (req, res) => {
  try {
    const { id } = req.params;
    const breed = await petService.getBreedById(id);
    res.status(200).json(breed);
  } catch (error) {
    if (error.message === "Breed not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.addUserPet = async (req, res) => {
  const { breedId, name, birthday, gender, currentWeight, healthNotes, avatar } = req.body;

  if (!breedId || !name || !birthday || !currentWeight) {
    return res.status(400).json({ message: "Обязательные данные: breedId, name, birthday, currentWeight." });
  }

  try {
    // Конвертируем gender в boolean
    // FormData всегда отправляет строки, поэтому нужно проверить строковые значения
    let genderValue;
    if (typeof gender === 'boolean') {
      genderValue = gender;
    } else if (typeof gender === 'string') {
      genderValue = gender.toLowerCase() === 'true';
    } else {
      genderValue = Boolean(gender);
    }
    
    const petData = {
      breedId,
      name,
      birthday,
      gender: genderValue,
      currentWeight,
      healthNotes,
    };

    // Если есть загруженный файл аватара
    if (req.file) {
      petData.avatar = `/uploads/${req.file.filename}`;
    } else if (avatar) {
      // Если передан URL аватара
      petData.avatar = avatar;
    }

    const userPet = await petService.addUserPet(req.user.userId, petData);
    res.status(201).json({ message: "Питомец добавлен", userPet });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyPets = async (req, res) => {
  try {
    const myPets = await petService.getMyPets(req.user.userId);
    res.status(200).json(myPets);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getPetById = async (req, res) => {
  try {
    const { id } = req.params;
    const pet = await petService.getPetById(id);
    res.status(200).json(pet);
  } catch (error) {
    if (error.message === "Pet not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updatePet = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };

    // Если есть загруженный файл аватара
    if (req.file) {
      updateData.avatar = `/uploads/${req.file.filename}`;
    } else if (updateData.avatar) {
      // Если передан URL аватара, оставляем его как есть
      // avatar уже в updateData из req.body
    }

    const updatedPet = await petService.updatePet(req.user.userId, id, updateData);
    res.status(200).json(updatedPet);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deletePet = async (req, res) => {
  try {
    const { id } = req.params;

    // Проверяем наличие пользователя
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Пользователь не авторизован" });
    }

    // Проверяем ID питомца
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ message: "ID питомца не указан" });
    }

    // Парсим ID питомца
    const petId = Number(id);
    if (!Number.isInteger(petId) || petId <= 0) {
      return res.status(400).json({ message: "Неверный ID питомца" });
    }

    // Парсим ID пользователя
    const userId = Number(req.user.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: "Неверный ID пользователя" });
    }

    const deletedPet = await petService.deletePet(petId, userId);
    res.status(200).json({ message: "Питомец успешно удален", deletedPet });
  } catch (err) {
    console.error('Ошибка при удалении питомца:', err);
    const statusCode = err.message.includes('не найден') ? 404 : 
                      err.message.includes('не принадлежит') ? 403 : 400;
    res.status(statusCode).json({ message: err.message || "Ошибка при удалении питомца" });
  }
};

exports.getReminders = async (req, res) => {
  try {
    const reminders = await petService.getReminders(req.user.userId);
    res.status(200).json(reminders);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.createReminder = async (req, res) => {
  try {
    const { 
      petId, 
      typeId, 
      reminderDate, 
      notes,
      frequencyType,
      frequencyInterval,
      frequencyUnit,
      notificationType,
      notificationValue,
      notificationUnit
    } = req.body;
    
    const frequencyData = frequencyType ? {
      frequencyType,
      frequencyInterval,
      frequencyUnit
    } : null;

    const notificationData = notificationType ? {
      notificationType,
      notificationValue,
      notificationUnit
    } : null;

    const reminder = await petService.createReminder(
      petId, 
      typeId, 
      reminderDate, 
      notes,
      frequencyData,
      notificationData
    );
    res.status(201).json({ message: "Напоминание создано", reminder });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateReminderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ message: "ID напоминания не указан" });
    }
    const updatedReminder = await petService.updateReminderStatus(id, status);
    res.status(200).json(updatedReminder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getReminderTypes = async (req, res) => {
  try {
    const types = await petService.getReminderTypes();
    res.status(200).json(types);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteCompletedReminders = async (req, res) => {
  try {
    // Проверяем наличие пользователя
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Пользователь не авторизован" });
    }

    // Парсим ID пользователя (используем тот же подход, что и в deletePet)
    const userId = Number(req.user.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: "Неверный ID пользователя" });
    }

    const hiddenCount = await petService.deleteCompletedReminders(userId);
    
    res.status(200).json({ 
      message: `Скрыто выполненных напоминаний: ${hiddenCount.count}`,
      deletedCount: hiddenCount.count 
    });
  } catch (err) {
    console.error('Ошибка при скрытии выполненных напоминаний:', err);
    res.status(400).json({ message: err.message || "Ошибка при скрытии выполненных напоминаний" });
  }
};

exports.deleteReminder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ message: "ID напоминания не указан" });
    }
    const result = await petService.deleteReminder(id, req.user.userId);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Pet Logs (Daily Records)
exports.createPetLog = async (req, res) => {
  try {
    const { id } = req.params;
    const logData = req.body;
    const log = await petService.createPetLog(req.user.userId, id, logData);
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getPetLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    const logs = await petService.getPetLogs(req.user.userId, id, startDate, endDate);
    res.status(200).json(logs);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deletePetLog = async (req, res) => {
  try {
    const { id, logId } = req.params;
    const result = await petService.deletePetLog(req.user.userId, id, logId);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getPetLogStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { days } = req.query;
    const stats = await petService.getPetLogStats(req.user.userId, id, days ? parseInt(days) : 30);
    res.status(200).json(stats);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.uploadFile = async (req, res) => {
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
    console.error('Ошибка при загрузке файла:', err);
    res.status(500).json({ message: err.message || 'Ошибка при загрузке файла' });
  }
};