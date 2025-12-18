const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getBreedChatMessages = async (breedId, limit = 50) => {
  const messages = await prisma.breed_chat_messages.findMany({
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
      reactions: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdat: 'desc',
    },
    take: limit,
  });

  return messages.reverse(); // Возвращаем в хронологическом порядке
};

exports.createBreedChatMessage = async (breedId, userId, message, attachmentOrAttachments = null) => {
  const hasText = message && message.trim().length > 0;

  // Нормализуем вложения: поддерживаем как один объект, так и массив
  let attachments = [];
  if (Array.isArray(attachmentOrAttachments)) {
    attachments = attachmentOrAttachments.filter(Boolean);
  } else if (attachmentOrAttachments) {
    attachments = [attachmentOrAttachments];
  }

  // Ограничиваем максимум 3 файла
  attachments = attachments.slice(0, 3);

  const hasAttachment = attachments.some(att => att && (att.url || att.attachment_url));

  if (!hasText && !hasAttachment) {
    throw new Error('Сообщение не может быть пустым');
  }

  if (hasText && message.length > 1000) {
    throw new Error('Сообщение слишком длинное (максимум 1000 символов)');
  }

  const data = {
    breedid: parseInt(breedId),
    userid: parseInt(userId),
    message: hasText ? message.trim() : '',
  };

  if (attachments.length > 0) {
    // Сохраняем полный список вложений в JSON-строку
    data.attachments = JSON.stringify(
      attachments.map(att => ({
        url: att.url || att.attachment_url || null,
        name: att.name || att.attachment_name || null,
        mimeType: att.mimeType || att.attachment_type || null,
        size: att.size || att.attachment_size || null,
      }))
    );

    // Для обратной совместимости дублируем первое вложение в старые поля
    const first = attachments[0];
    data.attachment_url = first.url || first.attachment_url || null;
    data.attachment_name = first.name || first.attachment_name || null;
    data.attachment_type = first.mimeType || first.attachment_type || null;
    data.attachment_size = first.size || first.attachment_size || null;
  }

  const chatMessage = await prisma.breed_chat_messages.create({
    data,
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

  return chatMessage;
};

exports.getBreedChatUsers = async (breedId) => {
  // Получаем уникальных пользователей, которые имеют питомцев данной породы
  const users = await prisma.users.findMany({
    where: {
      pets: {
        some: {
          breedid: parseInt(breedId),
        },
      },
    },
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
    },
  });

  return users;
};

exports.toggleReaction = async (messageId, userId, reaction) => {
  // Проверяем, существует ли уже такая реакция от этого пользователя
  const existingReaction = await prisma.breed_chat_reactions.findUnique({
    where: {
      messageid_userid_reaction: {
        messageid: parseInt(messageId),
        userid: parseInt(userId),
        reaction: reaction,
      },
    },
  });

  if (existingReaction) {
    // Удаляем реакцию, если она уже есть
    await prisma.breed_chat_reactions.delete({
      where: {
        id: existingReaction.id,
      },
    });
    return { action: 'removed', reaction: null };
  } else {
    // Удаляем другие реакции этого пользователя на это сообщение (если есть)
    await prisma.breed_chat_reactions.deleteMany({
      where: {
        messageid: parseInt(messageId),
        userid: parseInt(userId),
      },
    });

    // Добавляем новую реакцию
    const newReaction = await prisma.breed_chat_reactions.create({
      data: {
        messageid: parseInt(messageId),
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

exports.getMessageReactions = async (messageId) => {
  const reactions = await prisma.breed_chat_reactions.findMany({
    where: {
      messageid: parseInt(messageId),
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

  // Группируем реакции по значению
  const grouped = {};
  reactions.forEach(reaction => {
    if (!grouped[reaction.reaction]) {
      grouped[reaction.reaction] = [];
    }
    grouped[reaction.reaction].push(reaction.user);
  });

  return grouped;
};

exports.updateBreedChatMessage = async (messageId, userId, message) => {
  // Проверяем, существует ли сообщение и принадлежит ли оно пользователю
  const existingMessage = await prisma.breed_chat_messages.findUnique({
    where: {
      id: parseInt(messageId),
    },
  });

  if (!existingMessage) {
    throw new Error('Сообщение не найдено');
  }

  if (existingMessage.userid !== parseInt(userId)) {
    throw new Error('Вы можете редактировать только свои сообщения');
  }

  if (!message || message.trim().length === 0) {
    throw new Error('Сообщение не может быть пустым');
  }

  if (message.length > 1000) {
    throw new Error('Сообщение слишком длинное (максимум 1000 символов)');
  }

  const updatedMessage = await prisma.breed_chat_messages.update({
    where: {
      id: parseInt(messageId),
    },
    data: {
      message: message.trim(),
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

  return updatedMessage;
};

exports.deleteBreedChatMessage = async (messageId, userId) => {
  // Проверяем, существует ли сообщение и принадлежит ли оно пользователю
  const existingMessage = await prisma.breed_chat_messages.findUnique({
    where: {
      id: parseInt(messageId),
    },
  });

  if (!existingMessage) {
    throw new Error('Сообщение не найдено');
  }

  if (existingMessage.userid !== parseInt(userId)) {
    throw new Error('Вы можете удалять только свои сообщения');
  }

  await prisma.breed_chat_messages.delete({
    where: {
      id: parseInt(messageId),
    },
  });

  return { success: true, messageId: parseInt(messageId) };
};

