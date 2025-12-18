const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getSpecies = async () => {
  return await prisma.animal_species.findMany();
};

exports.getAllBreeds = async () => {
  return await prisma.animal_breeds.findMany({
    include: {
      species: true,
    },
    orderBy: {
      breedname: 'asc',
    },
  });
};

exports.getBreedsWithFilters = async (page, limit, filters) => {
  const skip = (page - 1) * limit;
  const { species, hypoallergenic, lifespan, size } = filters;

  // Строим условия фильтрации
  const whereConditions = {};
  
  // Фильтр по видам животных (species)
  if (species && species.length > 0) {
    whereConditions.speciesid = { in: species.map(id => parseInt(id)) };
  }
  
  // Фильтр по гипоаллергенности
  if (hypoallergenic !== undefined) {
    whereConditions.hypoallergenicity = hypoallergenic;
  }
  
  // Фильтр по размеру
  if (size && size.length > 0) {
    whereConditions.size = { in: size };
  }

  // Фильтр по продолжительности жизни
  if (lifespan && lifespan.length > 0) {
    // Парсим диапазоны продолжительности жизни (например, "10-12", "12-15", "15+")
    const lifespanFilters = lifespan.map(range => {
      if (range.includes('-')) {
        // Диапазон типа "10-12"
        const [min, max] = range.split('-').map(n => parseInt(n.trim()));
        return { min, max };
      } else if (range.endsWith('+')) {
        // Диапазон типа "15+"
        const min = parseInt(range.replace('+', '').trim());
        return { min, max: Infinity };
      } else {
        // Одно число
        const num = parseInt(range.trim());
        return { min: num, max: num };
      }
    });

    // Получаем все породы с другими фильтрами
    const allBreeds = await prisma.animal_breeds.findMany({
      where: whereConditions,
      include: {
        species: true,
      },
    });

    // Фильтруем по продолжительности жизни
    const filteredBreeds = allBreeds.filter(breed => {
      if (!breed.lifespan) return false;
      
      // Парсим значение lifespan породы (может быть "10-12 лет", "12-15", "15+ лет" и т.д.)
      const breedLifespan = breed.lifespan.replace(/лет|года|год/g, '').trim();
      
      // Пытаемся извлечь числа из строки
      const numbers = breedLifespan.match(/\d+/g);
      if (!numbers || numbers.length === 0) return false;
      
      // Если есть диапазон (например, "10-12")
      if (breedLifespan.includes('-')) {
        const breedMin = parseInt(numbers[0]);
        const breedMax = parseInt(numbers[1] || numbers[0]);
        
        // Проверяем, пересекается ли диапазон породы с любым из фильтров
        return lifespanFilters.some(filter => {
          if (filter.max === Infinity) {
            return breedMax >= filter.min;
          }
          return (breedMin <= filter.max && breedMax >= filter.min);
        });
      } else if (breedLifespan.includes('+')) {
        // Если указано "15+"
        const breedMin = parseInt(numbers[0]);
        return lifespanFilters.some(filter => {
          if (filter.max === Infinity) {
            return breedMin >= filter.min;
          }
          return breedMin <= filter.max && breedMin >= filter.min;
        });
      } else {
        // Одно число
        const breedValue = parseInt(numbers[0]);
        return lifespanFilters.some(filter => {
          if (filter.max === Infinity) {
            return breedValue >= filter.min;
          }
          return breedValue >= filter.min && breedValue <= filter.max;
        });
      }
    });

    // Применяем пагинацию
    const paginatedBreeds = filteredBreeds.slice(skip, skip + limit);
    const totalBreeds = filteredBreeds.length;

    return {
      breeds: paginatedBreeds,
      totalPages: Math.ceil(totalBreeds / limit),
    };
  }

  const breeds = await prisma.animal_breeds.findMany({
    where: whereConditions,
    skip,
    take: limit,
    include: {
      species: true,
    },
  });

  const totalBreeds = await prisma.animal_breeds.count({
    where: whereConditions,
  });

  return {
    breeds,
    totalPages: Math.ceil(totalBreeds / limit),
  };
};

exports.getBreedById = async (id) => {
  const breed = await prisma.animal_breeds.findUnique({
    where: { id: parseInt(id) },
    include: {
      species: true,
    },
  });

  if (!breed) {
    throw new Error("Breed not found");
  }

  return breed;
};

exports.addUserPet = async (userId, petData) => {
  const { breedId, name, avatar, birthday, gender, currentWeight, healthNotes, lastVaccinated, lastInspected, lastVitamins } = petData;

  const breed = await prisma.animal_breeds.findUnique({
    where: { id: parseInt(breedId) },
  });

  if (!breed) {
    throw new Error("Порода с указанным ID не найдена.");
  }

  const pet = await prisma.pets.create({
    data: {
      ownerid: parseInt(userId),
      breedid: parseInt(breedId),
      petname: name,
      avatar: avatar || null,
      birthday: new Date(birthday),
      gender,
      currentweight: parseFloat(currentWeight),
      healthnotes: healthNotes,
      lastvaccinated: lastVaccinated ? new Date(lastVaccinated) : null,
      lastinspected: lastInspected ? new Date(lastInspected) : null,
      lastvitamins: lastVitamins ? new Date(lastVitamins) : null,
      createdat: new Date(),
      updatedat: new Date()
    },
    include: {
      breed: {
        include: {
          species: true,
        },
      },
    },
  });

  return pet;
};

exports.getMyPets = async (userId) => {
  const pets = await prisma.pets.findMany({
    where: { ownerid: userId },
    include: {
      breed: {
        include: {
          species: true,
        },
      },
    },
    orderBy: {
      createdat: 'desc',
    },
  });

  return pets;
};

exports.getPetById = async (id) => {
  const pet = await prisma.pets.findUnique({
    where: { id: parseInt(id) },
    include: {
      breed: {
        include: {
          species: true,
        },
      },
      owner: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  if (!pet) {
    throw new Error("Pet not found");
  }

  return pet;
};

exports.updatePet = async (userId, petId, updateData) => {
  const pet = await prisma.pets.findUnique({
    where: { id: parseInt(petId) },
  });

  if (!pet || pet.ownerid !== userId) {
    throw new Error("Питомец не найден или не принадлежит пользователю.");
  }

  // Подготавливаем данные для обновления
  const updateFields = {
    updatedat: new Date()
  };

  // Обрабатываем основные поля
  if (updateData.name) {
    updateFields.petname = updateData.name;
  }
  if (updateData.birthday) {
    updateFields.birthday = new Date(updateData.birthday);
  }
  if (updateData.gender !== undefined) {
    // Конвертируем gender в boolean
    updateFields.gender = typeof updateData.gender === 'boolean' 
      ? updateData.gender 
      : (updateData.gender === 'true' || updateData.gender === true || updateData.gender === 'True');
  }
  if (updateData.currentWeight) {
    updateFields.currentweight = parseFloat(updateData.currentWeight);
  }
  if (updateData.breedId) {
    updateFields.breed = {
      connect: { id: parseInt(updateData.breedId) }
    };
  }
  if (updateData.healthNotes !== undefined) {
    updateFields.healthnotes = updateData.healthNotes;
  }
  // Обрабатываем аватар только если он есть
  if (updateData.avatar !== undefined && updateData.avatar !== null) {
    updateFields.avatar = updateData.avatar;
  }

  // Обрабатываем даты (поддерживаем оба варианта именования - camelCase и lowercase)
  if (updateData.lastVaccinated !== undefined || updateData.lastvaccinated !== undefined) {
    const dateValue = updateData.lastVaccinated || updateData.lastvaccinated;
    updateFields.lastvaccinated = dateValue ? new Date(dateValue) : null;
  }
  if (updateData.lastInspected !== undefined || updateData.lastinspected !== undefined) {
    const dateValue = updateData.lastInspected || updateData.lastinspected;
    updateFields.lastinspected = dateValue ? new Date(dateValue) : null;
  }
  if (updateData.lastVitamins !== undefined || updateData.lastvitamins !== undefined) {
    const dateValue = updateData.lastVitamins || updateData.lastvitamins;
    updateFields.lastvitamins = dateValue ? new Date(dateValue) : null;
  }
  if (updateData.lastParasiteTreatment !== undefined || updateData.lastparasitetreatment !== undefined) {
    const dateValue = updateData.lastParasiteTreatment || updateData.lastparasitetreatment;
    updateFields.lastparasitetreatment = dateValue ? new Date(dateValue) : null;
  }
  if (updateData.lastBathing !== undefined || updateData.lastbathing !== undefined) {
    const dateValue = updateData.lastBathing || updateData.lastbathing;
    updateFields.lastbathing = dateValue ? new Date(dateValue) : null;
  }
  if (updateData.lastGrooming !== undefined || updateData.lastgrooming !== undefined) {
    const dateValue = updateData.lastGrooming || updateData.lastgrooming;
    updateFields.lastgrooming = dateValue ? new Date(dateValue) : null;
  }
  if (updateData.lastTeethCleaning !== undefined || updateData.lastteethcleaning !== undefined) {
    const dateValue = updateData.lastTeethCleaning || updateData.lastteethcleaning;
    updateFields.lastteethcleaning = dateValue ? new Date(dateValue) : null;
  }
  if (updateData.lastNailTrimming !== undefined || updateData.lastnailtrimming !== undefined) {
    const dateValue = updateData.lastNailTrimming || updateData.lastnailtrimming;
    updateFields.lastnailtrimming = dateValue ? new Date(dateValue) : null;
  }

  const updatedPet = await prisma.pets.update({
    where: { id: parseInt(petId) },
    data: updateFields,
    include: {
      breed: {
        include: {
          species: true,
        },
      },
    },
  });

  return updatedPet;
};

exports.deletePet = async (petId, userId) => {
  // Валидация входных данных
  if (!Number.isInteger(petId) || petId <= 0) {
    throw new Error("Неверный ID питомца");
  }

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Неверный ID пользователя");
  }

  // Проверяем существование питомца
  const pet = await prisma.pets.findUnique({
    where: { id: petId },
  });

  if (!pet) {
    throw new Error("Питомец не найден");
  }

  // Проверяем права доступа
  if (pet.ownerid !== userId) {
    throw new Error("Вы не можете удалить питомца, который не принадлежит вам");
  }

  // Удаляем связанные напоминания
  await prisma.reminders.deleteMany({
    where: { petid: petId },
  });

  // Удаляем связанные записи журнала
  await prisma.pet_logs.deleteMany({
    where: { petid: petId },
  });

  // Удаляем питомца
  const deletedPet = await prisma.pets.delete({
    where: { id: petId },
  });

  return deletedPet;
};

exports.getReminders = async (userId) => {
  try {
    const reminders = await prisma.reminders.findMany({
      where: {
        pet: {
          ownerid: parseInt(userId),
        },
        hidden: false, // Не показываем скрытые напоминания
      },
      include: {
        pet: {
          include: {
            breed: {
              include: {
                species: true,
              },
            },
          },
        },
        type: true,
      },
      orderBy: {
        reminderdate: 'asc',
      },
    });

    return reminders;
  } catch (error) {
    // Если поле hidden еще не создано, получаем все напоминания и фильтруем на уровне приложения
    if (error.message && error.message.includes('Unknown column') || error.message.includes('column') || error.code === 'P2021') {
      const reminders = await prisma.reminders.findMany({
        where: {
          pet: {
            ownerid: parseInt(userId),
          },
        },
        include: {
          pet: {
            include: {
              breed: {
                include: {
                  species: true,
                },
              },
            },
          },
          type: true,
        },
        orderBy: {
          reminderdate: 'asc',
        },
      });

      // Фильтруем скрытые напоминания на уровне приложения
      return reminders.filter(r => r.hidden !== true);
    }
    throw error;
  }
};

exports.createReminder = async (petId, typeId, reminderDate, notes = null, frequencyData = null, notificationData = null) => {
  // Get pet to verify ownership
  const pet = await prisma.pets.findUnique({
    where: { id: parseInt(petId) },
  });

  if (!pet) {
    throw new Error("Pet not found");
  }

  const reminderData = {
    petid: parseInt(petId),
    rtid: parseInt(typeId),
    reminderdate: new Date(reminderDate),
    addedat: new Date(),
    status: 'pending',
    notes: notes || '',
  };

  // Добавляем данные о периодичности
  if (frequencyData) {
    reminderData.frequency_type = frequencyData.frequencyType || null;
    if (frequencyData.frequencyType === 'custom') {
      reminderData.frequency_interval = frequencyData.frequencyInterval ? parseInt(frequencyData.frequencyInterval) : null;
      reminderData.frequency_unit = frequencyData.frequencyUnit || null;
    } else {
      reminderData.frequency_interval = null;
      reminderData.frequency_unit = null;
    }
  }

  // Добавляем данные о времени оповещения
  if (notificationData) {
    reminderData.notification_type = notificationData.notificationType || null;
    if (notificationData.notificationType === 'custom') {
      reminderData.notification_value = notificationData.notificationValue ? parseInt(notificationData.notificationValue) : null;
      reminderData.notification_unit = notificationData.notificationUnit || null;
    } else {
      reminderData.notification_value = null;
      reminderData.notification_unit = null;
    }
  }

  const reminder = await prisma.reminders.create({
    data: reminderData,
    include: {
      pet: {
        include: {
          owner: true,
        },
      },
      type: true,
    },
  });

  return reminder;
};

exports.updateReminderStatus = async (id, status) => {
  if (!id || id === 'undefined' || id === 'null') {
    throw new Error("ID напоминания не указан");
  }

  const parsedId = parseInt(id);
  if (isNaN(parsedId) || parsedId <= 0) {
    throw new Error("Неверный ID напоминания");
  }

  // Сначала проверяем, существует ли напоминание
  const existingReminder = await prisma.reminders.findUnique({
    where: { id: parsedId },
  });

  if (!existingReminder) {
    throw new Error("Напоминание не найдено");
  }

  // При восстановлении напоминания сбрасываем флаг отправки уведомления
  const updateData = { status };
  if (status === 'pending') {
    updateData.notification_sent = false;
  }

  const reminder = await prisma.reminders.update({
    where: { id: parsedId },
    data: updateData,
    include: {
      pet: {
        include: {
          owner: true,
        },
      },
      type: true,
    },
  });

  return reminder;
};

exports.deleteCompletedReminders = async (userId) => {
  // Валидация входных данных
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Неверный ID пользователя");
  }

  try {
    // Сначала находим все питомцы пользователя
    const userPets = await prisma.pets.findMany({
      where: {
        ownerid: userId,
      },
      select: {
        id: true,
      },
    });

    // Если у пользователя нет питомцев, возвращаем пустой результат
    if (userPets.length === 0) {
      return { count: 0 };
    }

    const petIds = userPets.map(pet => pet.id);

    // Находим все выполненные и не скрытые напоминания для питомцев пользователя
    let completedReminders;
    try {
      completedReminders = await prisma.reminders.findMany({
        where: {
          status: 'completed',
          hidden: false,
          petid: {
            in: petIds,
          },
        },
        select: {
          id: true,
        },
      });
    } catch (error) {
      // Если поле hidden еще не создано, получаем все выполненные напоминания
      if (error.message && error.message.includes('Unknown column') || error.message.includes('column') || error.code === 'P2021') {
        const allCompleted = await prisma.reminders.findMany({
          where: {
            status: 'completed',
            petid: {
              in: petIds,
            },
          },
          select: {
            id: true,
            hidden: true,
          },
        });
        completedReminders = allCompleted.filter(r => !r.hidden);
      } else {
        throw error;
      }
    }

    // Если нет выполненных напоминаний, возвращаем пустой результат
    if (completedReminders.length === 0) {
      return { count: 0 };
    }

    // Скрываем найденные напоминания вместо удаления
    let hiddenCount;
    try {
      hiddenCount = await prisma.reminders.updateMany({
        where: {
          id: {
            in: completedReminders.map(r => r.id),
          },
        },
        data: {
          hidden: true,
        },
      });
    } catch (error) {
      // Если поле hidden еще не создано в БД, возвращаем ошибку с инструкцией
      if (error.message && (error.message.includes('Unknown column') || error.message.includes('column') || error.code === 'P2021')) {
        throw new Error("Поле 'hidden' еще не создано в базе данных. Пожалуйста, выполните миграцию: npx prisma migrate dev");
      }
      throw error;
    }

    return { count: hiddenCount.count };
  } catch (error) {
    console.error('Ошибка при скрытии напоминаний:', error);
    throw new Error(`Ошибка при скрытии напоминаний: ${error.message}`);
  }
};

exports.deleteReminder = async (reminderId, userId) => {
  if (!reminderId || reminderId === 'undefined' || reminderId === 'null') {
    throw new Error("ID напоминания не указан");
  }

  const parsedId = parseInt(reminderId);
  if (isNaN(parsedId) || parsedId <= 0) {
    throw new Error("Неверный ID напоминания");
  }

  // Проверяем, что напоминание принадлежит пользователю
  const reminder = await prisma.reminders.findUnique({
    where: { id: parsedId },
    include: {
      pet: true,
    },
  });

  if (!reminder) {
    throw new Error("Напоминание не найдено");
  }

  if (reminder.pet.ownerid !== parseInt(userId)) {
    throw new Error("Вы не можете удалить это напоминание");
  }

  await prisma.reminders.delete({
    where: { id: parsedId },
  });

  return { message: "Напоминание удалено" };
};

exports.getReminderTypes = async () => {
  return await prisma.reminder_types.findMany();
};

const parseBoolean = (value) => {
  if (value === true || value === false) return value;
  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true") return true;
    if (v === "false") return false;
  }
  return Boolean(value);
};

// Pet Logs (Daily Records)
exports.createPetLog = async (userId, petId, logData) => {
  // Проверяем, что питомец принадлежит пользователю
  const pet = await prisma.pets.findUnique({
    where: { id: parseInt(petId) },
  });

  if (!pet) {
    throw new Error("Питомец не найден");
  }

  if (pet.ownerid !== parseInt(userId)) {
    throw new Error("Вы не можете добавлять записи для этого питомца");
  }

  const {
    logId, // ID существующей записи для редактирования
    logdate,
    weight,
    size,
    mood,
    temperature,
    behavior,
    vaccination,
    vet_inspection,
    parasite_treatment,
    vitamins_medication,
    vitamins,
    medication,
    bathing,
    grooming,
    teeth_cleaning,
    nail_trimming,
    notes
  } = logData;

  // Если передан ID записи, обновляем существующую запись
  if (logId) {
    // Проверяем, что запись принадлежит этому питомцу
    const existingLog = await prisma.pet_logs.findUnique({
      where: { id: parseInt(logId) },
    });

    if (!existingLog) {
      throw new Error("Запись не найдена");
    }

    if (existingLog.petid !== parseInt(petId)) {
      throw new Error("Запись не принадлежит этому питомцу");
    }

    // Обновляем запись, включая дату
    const newLogDate = logdate ? new Date(logdate) : existingLog.logdate;
    newLogDate.setHours(0, 0, 0, 0);

    // Проверяем, нет ли другой записи этого питомца на выбранную дату,
    // чтобы не нарушить уникальное ограничение (petid, logdate)
    const nextDay = new Date(newLogDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const conflictingLog = await prisma.pet_logs.findFirst({
      where: {
        petid: parseInt(petId),
        id: { not: parseInt(logId) },
        logdate: {
          gte: newLogDate,
          lt: nextDay
        }
      }
    });

    if (conflictingLog) {
      throw new Error("Запись за эту дату уже существует. Измените дату или отредактируйте существующую запись.");
    }

    const log = await prisma.pet_logs.update({
      where: { id: parseInt(logId) },
      data: {
        logdate: newLogDate,
        weight: weight ? parseFloat(weight) : null,
        size: size ? parseFloat(size) : null,
        mood: mood ? parseInt(mood) : null,
        temperature: temperature ? parseFloat(temperature) : null,
        behavior: behavior || null,
        vaccination: parseBoolean(vaccination),
        vet_inspection: parseBoolean(vet_inspection),
        parasite_treatment: parseBoolean(parasite_treatment),
        vitamins_medication: parseBoolean(vitamins_medication),
        vitamins: parseBoolean(vitamins),
        medication: parseBoolean(medication),
        bathing: parseBoolean(bathing),
        grooming: parseBoolean(grooming),
        teeth_cleaning: parseBoolean(teeth_cleaning),
        nail_trimming: parseBoolean(nail_trimming),
        notes: notes || null
      },
      include: {
        pet: true
      }
    });

    return log;
  }

  // Если ID не передан, проверяем, есть ли уже запись на эту дату
  const logDate = logdate ? new Date(logdate) : new Date();
  // Устанавливаем время на начало дня для корректного сравнения
  logDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(logDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const existingLog = await prisma.pet_logs.findFirst({
    where: {
      petid: parseInt(petId),
      logdate: {
        gte: logDate,
        lt: nextDay
      }
    }
  });

  let log;
  if (existingLog) {
    // Обновляем существующую запись
    log = await prisma.pet_logs.update({
      where: { id: existingLog.id },
      data: {
        weight: weight ? parseFloat(weight) : null,
        size: size ? parseFloat(size) : null,
        mood: mood ? parseInt(mood) : null,
        temperature: temperature ? parseFloat(temperature) : null,
        behavior: behavior || null,
        vaccination: parseBoolean(vaccination),
        vet_inspection: parseBoolean(vet_inspection),
        parasite_treatment: parseBoolean(parasite_treatment),
        vitamins_medication: parseBoolean(vitamins_medication),
        vitamins: parseBoolean(vitamins),
        medication: parseBoolean(medication),
        bathing: parseBoolean(bathing),
        grooming: parseBoolean(grooming),
        teeth_cleaning: parseBoolean(teeth_cleaning),
        nail_trimming: parseBoolean(nail_trimming),
        notes: notes || null
      },
      include: {
        pet: true
      }
    });
  } else {
    // Создаем новую запись
    const newLogDate = logdate ? new Date(logdate) : new Date();
    newLogDate.setHours(0, 0, 0, 0);
    log = await prisma.pet_logs.create({
      data: {
        petid: parseInt(petId),
        logdate: newLogDate,
        weight: weight ? parseFloat(weight) : null,
        size: size ? parseFloat(size) : null,
        mood: mood ? parseInt(mood) : null,
        temperature: temperature ? parseFloat(temperature) : null,
        behavior: behavior || null,
        vaccination: parseBoolean(vaccination),
        vet_inspection: parseBoolean(vet_inspection),
        parasite_treatment: parseBoolean(parasite_treatment),
        vitamins_medication: parseBoolean(vitamins_medication),
        vitamins: parseBoolean(vitamins),
        medication: parseBoolean(medication),
        bathing: parseBoolean(bathing),
        grooming: parseBoolean(grooming),
        teeth_cleaning: parseBoolean(teeth_cleaning),
        nail_trimming: parseBoolean(nail_trimming),
        notes: notes || null
      },
      include: {
        pet: true
      }
    });
  }

  return log;
};

exports.getPetLogs = async (userId, petId, startDate, endDate) => {
  // Проверяем, что питомец принадлежит пользователю
  const pet = await prisma.pets.findUnique({
    where: { id: parseInt(petId) },
  });

  if (!pet) {
    throw new Error("Питомец не найден");
  }

  if (pet.ownerid !== parseInt(userId)) {
    throw new Error("Вы не можете просматривать записи этого питомца");
  }

  const where = {
    petid: parseInt(petId)
  };

  if (startDate || endDate) {
    where.logdate = {};
    if (startDate) {
      where.logdate.gte = new Date(startDate);
    }
    if (endDate) {
      where.logdate.lte = new Date(endDate);
    }
  }

  const logs = await prisma.pet_logs.findMany({
    where,
    orderBy: {
      logdate: 'desc'
    }
  });

  return logs;
};

exports.deletePetLog = async (userId, petId, logId) => {
  // Проверяем, что питомец принадлежит пользователю
  const pet = await prisma.pets.findUnique({
    where: { id: parseInt(petId) },
  });

  if (!pet) {
    throw new Error("Питомец не найден");
  }

  if (pet.ownerid !== parseInt(userId)) {
    throw new Error("Вы не можете удалять записи этого питомца");
  }

  // Проверяем, что запись существует и принадлежит питомцу
  const log = await prisma.pet_logs.findUnique({
    where: { id: parseInt(logId) },
  });

  if (!log) {
    throw new Error("Запись не найдена");
  }

  if (log.petid !== parseInt(petId)) {
    throw new Error("Запись не принадлежит этому питомцу");
  }

  await prisma.pet_logs.delete({
    where: { id: parseInt(logId) },
  });

  return { message: "Запись удалена" };
};

exports.getPetLogStats = async (userId, petId, days = 30) => {
  // Проверяем, что питомец принадлежит пользователю
  const pet = await prisma.pets.findUnique({
    where: { id: parseInt(petId) },
  });

  if (!pet) {
    throw new Error("Питомец не найден");
  }

  if (pet.ownerid !== parseInt(userId)) {
    throw new Error("Вы не можете просматривать статистику этого питомца");
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const logs = await prisma.pet_logs.findMany({
    where: {
      petid: parseInt(petId),
      logdate: {
        gte: startDate
      }
    },
    orderBy: {
      logdate: 'asc'
    }
  });

  return logs;
};