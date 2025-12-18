const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

exports.getUserInfo = async (userId) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        telegram_chat_id: true,
        gender: true,
        weight_unit: true,
      },
    });

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    throw error;
  }
};

exports.updateUserInfo = async (userId, updatedData) => {
  try {
    // Преобразуем telegramChatId в telegram_chat_id для базы данных
    const dbData = { ...updatedData };
    if (dbData.telegramChatId !== undefined) {
      dbData.telegram_chat_id = dbData.telegramChatId || null;
      delete dbData.telegramChatId;
    }

    // Преобразуем weightUnit в weight_unit для базы данных
    if (dbData.weightUnit !== undefined) {
      dbData.weight_unit = dbData.weightUnit || 'kg_and_g';
      delete dbData.weightUnit;
    }

    // Обрабатываем пустые строки для опциональных полей
    if (dbData.gender === '') {
      dbData.gender = null;
    }

    const updatedUser = await prisma.users.update({
      where: { id: Number(userId) },
      data: dbData,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        telegram_chat_id: true,
        gender: true,
        weight_unit: true,
      },
    });

    return updatedUser;
  } catch (error) {
    throw error;
  }
};

exports.updatePassword = async (userId, oldPassword, newPassword) => {
  try {
    // Получаем пользователя с паролем
    const user = await prisma.users.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      throw new Error("Пользователь не найден");
    }

    // Проверяем старый пароль
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new Error("Неверный текущий пароль");
    }

    // Хешируем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Обновляем пароль
    await prisma.users.update({
      where: { id: Number(userId) },
      data: {
        password: hashedPassword,
      },
    });

    return { message: "Пароль успешно изменен" };
  } catch (error) {
    throw error;
  }
};