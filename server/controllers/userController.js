const userService = require("../services/userService");

exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await userService.getUserInfo(userId);

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при получении информации о пользователе" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const user = await userService.getUserInfo(userId);

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при получении информации о пользователе" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Получаем данные из body (могут быть из FormData или JSON)
    const username = req.body.username;
    const name = req.body.name;
    const email = req.body.email;
    const telegramChatId = req.body.telegramChatId;
    const gender = req.body.gender;
    const weightUnit = req.body.weightUnit;
    
    // Проверяем обязательные поля
    if (!username || !name || !email) {
      return res.status(400).json({ message: "Необходимо указать username, name и email" });
    }

    let updateData = { 
      username: username.trim(), 
      name: name.trim(), 
      email: email.trim()
    };

    // Добавляем gender если он передан
    if (gender !== undefined) {
      updateData.gender = gender.trim() || null;
    }

    // Добавляем weight_unit если он передан
    if (weightUnit !== undefined) {
      updateData.weightUnit = weightUnit.trim() || 'kg_and_g';
    }

    // Если есть загруженный файл аватара
    if (req.file) {
      updateData.avatar = `/uploads/${req.file.filename}`;
    } else if (req.body.avatar !== undefined && req.body.avatar !== '') {
      // Если avatar передан как строка (URL или null для удаления)
      updateData.avatar = req.body.avatar || null;
    }

    // Добавляем telegram_chat_id если он передан
    if (telegramChatId !== undefined) {
      // Если передан пустой строкой, устанавливаем null, иначе обрезаем пробелы
      updateData.telegramChatId = telegramChatId.trim() || null;
    }

    const updatedUser = await userService.updateUserInfo(userId, updateData);

    if (!updatedUser) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Ошибка при обновлении пользователя:', error);
    res.status(500).json({ 
      message: "Ошибка при изменении информации",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // Валидация
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Все поля обязательны для заполнения" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Новый пароль и подтверждение не совпадают" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Пароль должен содержать минимум 6 символов" });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({ message: "Новый пароль должен отличаться от текущего" });
    }

    await userService.updatePassword(userId, oldPassword, newPassword);
    res.status(200).json({ message: "Пароль успешно изменен" });
  } catch (error) {
    console.error('Ошибка при обновлении пароля:', error);
    res.status(400).json({ 
      message: error.message || "Ошибка при изменении пароля"
    });
  }
};