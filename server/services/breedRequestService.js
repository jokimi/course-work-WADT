const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const telegramService = require("./telegramService");
const adminService = require("./adminService");

exports.createBreedRequest = async (userId, breedData) => {
    // Проверяем, не существует ли уже порода с таким именем
    const existingBreed = await prisma.animal_breeds.findFirst({
        where: {
            breedname: {
                equals: breedData.breedName,
                mode: 'insensitive' // Регистронезависимый поиск
            }
        }
    });

    if (existingBreed) {
        throw new Error(`Порода с названием "${breedData.breedName}" уже существует в каталоге`);
    }

    // Проверяем, нет ли уже заявки с таким именем (pending или approved)
    const existingRequest = await prisma.breed_requests.findFirst({
        where: {
            breedname: {
                equals: breedData.breedName,
                mode: 'insensitive'
            },
            status: {
                in: ['pending', 'approved']
            }
        }
    });

    if (existingRequest) {
        throw new Error(`Заявка на породу "${breedData.breedName}" уже существует и находится на рассмотрении или одобрена`);
    }

    const request = await prisma.breed_requests.create({
        data: {
            userid: parseInt(userId),
            speciesid: parseInt(breedData.speciesId),
            breedname: breedData.breedName,
            short_description: breedData.shortDescription || null,
            description: breedData.description,
            photo: breedData.photo,
            hypoallergenicity: typeof breedData.hypoallergenicity === 'boolean' 
                ? breedData.hypoallergenicity 
                : (breedData.hypoallergenicity === 'true' || breedData.hypoallergenicity === 'True' || breedData.hypoallergenicity === true),
            trainability: breedData.trainability ? parseInt(breedData.trainability) : null,
            weight: breedData.weight,
            height: breedData.height,
            size: breedData.size,
            lifespan: breedData.lifespan,
            countryoforigin: breedData.countryOfOrigin,
            // Общие характеристики
      shedding: breedData.shedding ? parseInt(breedData.shedding) : null,
      activity: breedData.activity ? parseInt(breedData.activity) : null,
      friendliness: breedData.friendliness ? parseInt(breedData.friendliness) : null,
      cleanliness: breedData.cleanliness ? parseInt(breedData.cleanliness) : null,
      other_animals_attitude: breedData.otherAnimalsAttitude ? parseInt(breedData.otherAnimalsAttitude) : null,
            // Характеристики для кошек
            grooming: breedData.grooming ? parseInt(breedData.grooming) : null,
            affection: breedData.affection ? parseInt(breedData.affection) : null,
            fur_type: breedData.furType || null,
            // Характеристики для собак
            guard_qualities: breedData.guardQualities ? parseInt(breedData.guardQualities) : null,
            grooming_needs: breedData.groomingNeeds ? parseInt(breedData.groomingNeeds) : null,
            noise: breedData.noise ? parseInt(breedData.noise) : null,
            pros: breedData.pros || null,
            cons: breedData.cons || null,
            gallery: breedData.gallery || null,
            status: 'pending',
            createdat: new Date()
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    name: true,
                },
            },
        },
    });

    return request;
};

exports.getBreedRequests = async () => {
    const requests = await prisma.breed_requests.findMany({
        where: {
            status: {
                notIn: ['approved', 'rejected'] // Исключаем одобренные и отклоненные заявки из админ-панели
            }
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    name: true,
                },
            },
            species: {
                select: {
                    id: true,
                    speciesname: true,
                    speciesicon: true,
                },
            },
        },
        orderBy: {
            id: 'desc',
        },
    });

    return requests;
};

exports.getUserBreedRequests = async (userId) => {
    const requests = await prisma.breed_requests.findMany({
        where: { userid: userId },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    name: true,
                },
            },
        },
        orderBy: {
            id: 'desc',
        },
    });

    return requests;
};

exports.updateBreedRequestStatus = async (id, status) => {
    // Сначала получаем полные данные заявки
    const request = await prisma.breed_requests.findUnique({
        where: { id: parseInt(id) },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    name: true,
                    telegram_chat_id: true,
                },
            },
            species: true,
        },
    });

    if (!request) {
        throw new Error('Заявка не найдена');
    }

    // Обновляем статус заявки
    const updatedRequest = await prisma.breed_requests.update({
        where: { id: parseInt(id) },
        data: { status },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    name: true,
                    telegram_chat_id: true,
                },
            },
            species: true,
        },
    });

    // Если заявка одобрена, создаем породу в каталоге
    if (status === 'approved') {
        try {
            console.log(`🔄 Начинаем создание породы из заявки ID: ${id}, название: "${request.breedname}"`);
            
            // Валидация обязательных полей
            const requiredFields = {
                speciesid: request.speciesid,
                breedname: request.breedname,
                description: request.description,
                photo: request.photo,
                weight: request.weight,
                height: request.height,
                size: request.size,
                lifespan: request.lifespan,
                countryoforigin: request.countryoforigin
            };
            
            const missingFields = Object.entries(requiredFields)
                .filter(([key, value]) => value === null || value === undefined || value === '')
                .map(([key]) => key);
            
            if (missingFields.length > 0) {
                throw new Error(`Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
            }
            
            // Преобразуем данные заявки в формат для создания породы
            const breedData = {
                speciesId: request.speciesid.toString(),
                name: request.breedname,
                shortDescription: request.short_description || null,
                description: request.description,
                photo: request.photo,
                hypoallergenicity: request.hypoallergenicity !== null && request.hypoallergenicity !== undefined 
                    ? request.hypoallergenicity 
                    : false,
                trainability: request.trainability ? request.trainability.toString() : null,
                weight: request.weight,
                height: request.height,
                size: request.size,
                lifespan: request.lifespan,
                countryOfOrigin: request.countryoforigin,
      // Общие характеристики
      shedding: request.shedding ? request.shedding.toString() : null,
      activity: request.activity ? request.activity.toString() : null,
      friendliness: request.friendliness ? request.friendliness.toString() : null,
      cleanliness: request.cleanliness ? request.cleanliness.toString() : null,
      otherAnimalsAttitude: request.other_animals_attitude ? request.other_animals_attitude.toString() : null,
                // Характеристики для кошек
                grooming: request.grooming ? request.grooming.toString() : null,
                affection: request.affection ? request.affection.toString() : null,
                furType: request.fur_type || null,
                // Характеристики для собак
                guardQualities: request.guard_qualities ? request.guard_qualities.toString() : null,
                groomingNeeds: request.grooming_needs ? request.grooming_needs.toString() : null,
                noise: request.noise ? request.noise.toString() : null,
                pros: request.pros || null,
                cons: request.cons || null,
                gallery: request.gallery || null
            };

            console.log('📦 Данные для создания породы:', JSON.stringify(breedData, null, 2));
            
            const createdBreed = await adminService.addBreed(breedData);
            console.log(`✅ Порода "${request.breedname}" успешно добавлена в каталог! ID породы: ${createdBreed.id}`);
        } catch (error) {
            console.error('❌ Ошибка при создании породы из заявки:', error);
            console.error('Детали ошибки:', {
                message: error.message,
                code: error.code,
                meta: error.meta,
                stack: error.stack
            });
            
            // Если порода уже существует, это не критично
            if (error.code === 'P2002' || (error.message && error.message.includes('Unique constraint'))) {
                console.log(`⚠️ Порода "${request.breedname}" уже существует в каталоге`);
            } else {
                // Пробрасываем другие ошибки, чтобы они были видны на клиенте
                throw new Error(`Не удалось создать породу из заявки: ${error.message || 'Неизвестная ошибка'}`);
            }
        }
    }

    // Отправляем уведомление в Telegram, если статус изменился на approved или rejected
    if ((status === 'approved' || status === 'rejected') && updatedRequest.user?.telegram_chat_id) {
        try {
            // Преобразуем telegram_chat_id в строку, если это необходимо
            const chatId = String(updatedRequest.user.telegram_chat_id);
            await telegramService.sendBreedRequestNotification(
                chatId,
                updatedRequest,
                status
            );
        } catch (error) {
            console.error('Ошибка при отправке Telegram уведомления о заявке:', error);
            // Не прерываем выполнение, если уведомление не отправилось
        }
    }

    return updatedRequest;
};

exports.updateBreedRequest = async (id, breedData) => {
    // Проверяем, существует ли заявка
    const existingRequest = await prisma.breed_requests.findUnique({
        where: { id: parseInt(id) },
    });

    if (!existingRequest) {
        throw new Error('Заявка не найдена');
    }

    // Проверяем, что заявка еще не одобрена или отклонена
    if (existingRequest.status !== 'pending') {
        throw new Error('Невозможно редактировать заявку, которая уже одобрена или отклонена');
    }

    // Подготавливаем данные для обновления
    const updateData = {};

    if (breedData.speciesId !== undefined) {
        updateData.speciesid = parseInt(breedData.speciesId);
    }
    if (breedData.breedName !== undefined) {
        updateData.breedname = breedData.breedName;
    }
    if (breedData.shortDescription !== undefined) {
        updateData.short_description = breedData.shortDescription || null;
    }
    if (breedData.description !== undefined) {
        updateData.description = breedData.description;
    }
    if (breedData.photo !== undefined) {
        updateData.photo = breedData.photo;
    }
    if (breedData.hypoallergenicity !== undefined) {
        updateData.hypoallergenicity = typeof breedData.hypoallergenicity === 'boolean' 
            ? breedData.hypoallergenicity 
            : (breedData.hypoallergenicity === 'true' || breedData.hypoallergenicity === 'True' || breedData.hypoallergenicity === true);
    }
    if (breedData.trainability !== undefined) {
        updateData.trainability = breedData.trainability ? parseInt(breedData.trainability) : null;
    }
    if (breedData.weight !== undefined) {
        updateData.weight = breedData.weight;
    }
    if (breedData.height !== undefined) {
        updateData.height = breedData.height;
    }
    if (breedData.size !== undefined) {
        updateData.size = breedData.size;
    }
    if (breedData.lifespan !== undefined) {
        updateData.lifespan = breedData.lifespan;
    }
    if (breedData.countryOfOrigin !== undefined) {
        updateData.countryoforigin = breedData.countryOfOrigin;
    }
    // Общие характеристики
    if (breedData.shedding !== undefined) {
        updateData.shedding = breedData.shedding ? parseInt(breedData.shedding) : null;
    }
    if (breedData.activity !== undefined) {
        updateData.activity = breedData.activity ? parseInt(breedData.activity) : null;
    }
    if (breedData.friendliness !== undefined) {
        updateData.friendliness = breedData.friendliness ? parseInt(breedData.friendliness) : null;
    }
    if (breedData.cleanliness !== undefined) {
        updateData.cleanliness = breedData.cleanliness ? parseInt(breedData.cleanliness) : null;
    }
    if (breedData.otherAnimalsAttitude !== undefined) {
        updateData.other_animals_attitude = breedData.otherAnimalsAttitude ? parseInt(breedData.otherAnimalsAttitude) : null;
    }
    // Характеристики для кошек
    if (breedData.grooming !== undefined) {
        updateData.grooming = breedData.grooming ? parseInt(breedData.grooming) : null;
    }
    if (breedData.affection !== undefined) {
        updateData.affection = breedData.affection ? parseInt(breedData.affection) : null;
    }
    if (breedData.furType !== undefined) {
        updateData.fur_type = breedData.furType || null;
    }
    // Характеристики для собак
    if (breedData.guardQualities !== undefined) {
        updateData.guard_qualities = breedData.guardQualities ? parseInt(breedData.guardQualities) : null;
    }
    if (breedData.groomingNeeds !== undefined) {
        updateData.grooming_needs = breedData.groomingNeeds ? parseInt(breedData.groomingNeeds) : null;
    }
    if (breedData.noise !== undefined) {
        updateData.noise = breedData.noise ? parseInt(breedData.noise) : null;
    }
    if (breedData.pros !== undefined) {
        updateData.pros = breedData.pros || null;
    }
    if (breedData.cons !== undefined) {
        updateData.cons = breedData.cons || null;
    }
    if (breedData.gallery !== undefined) {
        updateData.gallery = breedData.gallery || null;
    }

    const updatedRequest = await prisma.breed_requests.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    name: true,
                },
            },
            species: {
                select: {
                    id: true,
                    speciesname: true,
                    speciesicon: true,
                },
            },
        },
    });

    return updatedRequest;
};