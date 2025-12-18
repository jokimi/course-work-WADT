const TelegramBot = require('node-telegram-bot-api');

// Получаем токен бота из переменных окружения
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

let bot = null;

// Инициализация бота
if (BOT_TOKEN) {
  bot = new TelegramBot(BOT_TOKEN, { polling: false });
} else {
  console.warn('⚠️  TELEGRAM_BOT_TOKEN не установлен. Уведомления в Telegram отключены.');
}

/**
 * Валидирует chat_id - проверяет, что это не токен бота и что это валидный chat_id
 * @param {string} chatId - Telegram Chat ID для проверки
 * @returns {boolean} - true если валидный, false если нет
 */
const isValidChatId = (chatId) => {
  if (!chatId || typeof chatId !== 'string') {
    return false;
  }
  
  // Проверяем, что это не токен бота (токен содержит двоеточие и буквы)
  if (chatId.includes(':') && /[A-Za-z]/.test(chatId)) {
    console.warn(`⚠️  Обнаружен токен бота вместо chat_id: ${chatId.substring(0, 20)}...`);
    return false;
  }
  
  // Chat ID должен быть числом (может быть отрицательным для групп)
  const chatIdNum = parseInt(chatId);
  if (isNaN(chatIdNum)) {
    console.warn(`⚠️  Некорректный формат chat_id: ${chatId}`);
    return false;
  }
  
  return true;
};

/**
 * Отправляет уведомление о напоминании пользователю в Telegram
 * @param {string} chatId - Telegram Chat ID пользователя
 * @param {Object} reminder - Объект напоминания
 * @returns {Promise<boolean>} - true если отправлено успешно, false в противном случае
 */
exports.sendReminderNotification = async (chatId, reminder) => {
  if (!bot || !chatId) {
    return false;
  }

  // Валидация chat_id
  if (!isValidChatId(chatId)) {
    console.error(`❌ Некорректный chat_id: ${chatId}. Убедитесь, что указан правильный Telegram Chat ID пользователя, а не токен бота.`);
    return false;
  }

  try {
    const petName = reminder.pet?.petname || reminder.pet?.name || 'питомец';
    const reminderType = reminder.type?.rtname || reminder.type?.name || 'напоминание';
    
    // Получаем дату напоминания (может быть в разных форматах)
    const reminderDateValue = reminder.reminderdate || reminder.reminderDate;
    const reminderDateObj = new Date(reminderDateValue);
    
    // Форматируем дату и время
    const reminderDate = reminderDateObj.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const isOverdue = reminder.isOverdue || reminderDateObj < new Date();
    const emoji = isOverdue ? '⚠️' : '🔔';
    const title = isOverdue ? 'Просроченное напоминание' : 'Напоминание о уходе за питомцем';
    
    let message = `${emoji} *${title}*\n\n`;
    message += `*Тип:* ${reminderType}\n`;
    message += `*Питомец:* ${petName}\n`;
    message += `*Дата и время:* ${reminderDate}\n`;

    if (reminder.notes) {
      message += `*Заметки:* ${reminder.notes}\n`;
    }

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    console.log(`✅ Уведомление отправлено в Telegram для chatId: ${chatId}`);
    return true;
  } catch (error) {
    console.error('Ошибка при отправке уведомления в Telegram:', error);
    console.error('Детали ошибки:', error.response?.body || error.message);
    return false;
  }
};

/**
 * Отправляет уведомление о статусе заявки на породу пользователю в Telegram
 * @param {string} chatId - Telegram Chat ID пользователя
 * @param {Object} request - Объект заявки на породу
 * @param {string} status - Статус заявки ('approved' или 'rejected')
 * @returns {Promise<boolean>} - true если отправлено успешно, false в противном случае
 */
exports.sendBreedRequestNotification = async (chatId, request, status) => {
  if (!bot || !chatId) {
    return false;
  }

  // Валидация chat_id
  if (!isValidChatId(chatId)) {
    console.error(`❌ Некорректный chat_id: ${chatId}. Убедитесь, что указан правильный Telegram Chat ID пользователя.`);
    return false;
  }

  try {
    const breedName = request.breedname || 'порода';
    const isApproved = status === 'approved';
    const emoji = isApproved ? '✅' : '❌';
    const title = isApproved ? 'Заявка на породу одобрена' : 'Заявка на породу отклонена';
    
    let message = `${emoji} *${title}*\n\n`;
    message += `*Порода:* ${breedName}\n`;
    
    if (isApproved) {
      message += `\nВаша заявка на добавление породы "${breedName}" была одобрена администратором. Порода теперь доступна в каталоге!`;
    } else {
      message += `\nК сожалению, ваша заявка на добавление породы "${breedName}" была отклонена администратором.`;
    }

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    console.log(`✅ Уведомление о заявке отправлено в Telegram для chatId: ${chatId}, статус: ${status}`);
    return true;
  } catch (error) {
    console.error('Ошибка при отправке уведомления о заявке в Telegram:', error);
    console.error('Детали ошибки:', error.response?.body || error.message);
    return false;
  }
};

/**
 * Отправляет произвольное сообщение пользователю в Telegram
 * @param {string} chatId - Telegram Chat ID пользователя
 * @param {string} message - Текст сообщения
 * @returns {Promise<boolean>} - true если отправлено успешно, false в противном случае
 */
exports.sendMessage = async (chatId, message) => {
  if (!bot || !chatId) {
    console.warn('⚠️ Telegram бот не инициализирован или chatId не указан');
    return false;
  }

  // Преобразуем chatId в строку для валидации
  const chatIdString = String(chatId).trim();

  // Валидация chat_id
  if (!isValidChatId(chatIdString)) {
    console.error(`❌ Некорректный chat_id: ${chatIdString}. Убедитесь, что указан правильный Telegram Chat ID пользователя.`);
    return false;
  }

  try {
    await bot.sendMessage(chatIdString, message, { parse_mode: 'Markdown' });
    console.log(`✅ Сообщение отправлено в Telegram для chatId: ${chatIdString}`);
    return true;
  } catch (error) {
    console.error('Ошибка при отправке сообщения в Telegram:', error);
    console.error('Детали ошибки:', error.response?.body || error.message);
    console.error('ChatId:', chatIdString);
    return false;
  }
};

/**
 * Проверяет, доступен ли бот
 * @returns {boolean}
 */
exports.isBotAvailable = () => {
  return bot !== null;
};

