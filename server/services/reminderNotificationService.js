const { PrismaClient } = require('@prisma/client');
const telegramService = require('./telegramService');

const prisma = new PrismaClient();

/**
 * Вычисляет время отправки уведомления на основе настроек напоминания
 * @param {Object} reminder - Объект напоминания
 * @returns {Date} - Время, когда нужно отправить уведомление
 */
const calculateNotificationTime = (reminder) => {
  const reminderDate = new Date(reminder.reminderdate);
  const notificationType = reminder.notification_type || 'at_start';
  
  let offsetMs = 0;
  
  switch (notificationType) {
    case 'at_start':
      offsetMs = 0;
      break;
    case '1min':
      offsetMs = 1 * 60 * 1000;
      break;
    case '5min':
      offsetMs = 5 * 60 * 1000;
      break;
    case '10min':
      offsetMs = 10 * 60 * 1000;
      break;
    case '15min':
      offsetMs = 15 * 60 * 1000;
      break;
    case '30min':
      offsetMs = 30 * 60 * 1000;
      break;
    case '1hour':
      offsetMs = 60 * 60 * 1000;
      break;
    case '1day':
      offsetMs = 24 * 60 * 60 * 1000;
      break;
    case 'custom':
      const value = reminder.notification_value || 0;
      const unit = reminder.notification_unit || 'min';
      if (unit === 'min') {
        offsetMs = value * 60 * 1000;
      } else if (unit === 'hour') {
        offsetMs = value * 60 * 60 * 1000;
      } else if (unit === 'day') {
        offsetMs = value * 24 * 60 * 60 * 1000;
      }
      break;
    default:
      offsetMs = 0;
  }
  
  return new Date(reminderDate.getTime() - offsetMs);
};

/**
 * Проверяет напоминания и отправляет уведомления пользователям
 * Вызывается по расписанию (каждую минуту)
 */
exports.checkAndSendReminders = async () => {
  try {
    const now = new Date();
    // Максимальное время заблаговременного уведомления — 1 день + запас
    // Это позволяет найти напоминания, для которых уведомление должно быть отправлено сейчас
    const maxFutureCheck = new Date(now.getTime() + 25 * 60 * 60 * 1000); // +25 часов

    // Находим все активные напоминания, которые ещё не были отправлены
    // и событие которых в пределах максимального окна уведомления
    const reminders = await prisma.reminders.findMany({
      where: {
        status: 'pending',
        notification_sent: false,
        reminderdate: {
          lte: maxFutureCheck, // Событие в пределах окна уведомления
        },
      },
      include: {
        pet: {
          include: {
            owner: {
              select: {
                id: true,
                telegram_chat_id: true,
                name: true,
              },
            },
            breed: {
              include: {
                species: true,
              },
            },
          },
        },
        type: true,
      },
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const reminder of reminders) {
      // Вычисляем время отправки уведомления
      const notificationTime = calculateNotificationTime(reminder);
      
      // Проверяем, пришло ли время отправлять уведомление (с запасом в 1 минуту)
      const timeDiff = notificationTime.getTime() - now.getTime();
      if (timeDiff > 60 * 1000) {
        continue; // Ещё рано отправлять (больше минуты до времени уведомления)
      }

      const chatId = reminder.pet?.owner?.telegram_chat_id;

      if (chatId && telegramService.isBotAvailable()) {
        const sent = await telegramService.sendReminderNotification(chatId, reminder);
        if (sent) {
          sentCount++;
          // Отмечаем, что уведомление отправлено
          await prisma.reminders.update({
            where: { id: reminder.id },
            data: { notification_sent: true }
          });
        } else {
          failedCount++;
        }
      } else if (!chatId) {
        console.log(`⚠️  Пользователь ${reminder.pet?.owner?.name || 'Неизвестный'} не указал Telegram Chat ID`);
        // Отмечаем как отправленное, чтобы не пытаться повторно
        await prisma.reminders.update({
          where: { id: reminder.id },
          data: { notification_sent: true }
        });
      } else if (!telegramService.isBotAvailable()) {
        console.log(`⚠️  Telegram бот недоступен. Проверьте TELEGRAM_BOT_TOKEN в .env`);
      }
    }

    if (sentCount > 0 || failedCount > 0) {
      console.log(`📨 Отправлено уведомлений: ${sentCount}, ошибок: ${failedCount}`);
    }

    return { sentCount, failedCount, total: reminders.length };
  } catch (error) {
    console.error('Ошибка при проверке напоминаний:', error);
    throw error;
  }
};

/**
 * Проверяет просроченные напоминания и отправляет уведомления
 */
exports.checkOverdueReminders = async () => {
  try {
    const now = new Date();

    // Находим просроченные активные напоминания (до 24 часов назад)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const reminders = await prisma.reminders.findMany({
      where: {
        status: 'pending',
        reminderdate: {
          gte: yesterday,
          lt: now,
        },
      },
      include: {
        pet: {
          include: {
            owner: {
              select: {
                id: true,
                telegram_chat_id: true,
                name: true,
              },
            },
            breed: {
              include: {
                species: true,
              },
            },
          },
        },
        type: true,
      },
    });

    let sentCount = 0;

    for (const reminder of reminders) {
      const chatId = reminder.pet?.owner?.telegram_chat_id;

      if (chatId && telegramService.isBotAvailable()) {
        const sent = await telegramService.sendReminderNotification(chatId, {
          ...reminder,
          isOverdue: true,
        });
        if (sent) {
          sentCount++;
        }
      }
    }

    if (sentCount > 0) {
      console.log(`⚠️  Отправлено уведомлений о просроченных напоминаниях: ${sentCount}`);
    }

    return { sentCount, total: reminders.length };
  } catch (error) {
    console.error('Ошибка при проверке просроченных напоминаний:', error);
    throw error;
  }
};

