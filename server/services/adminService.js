const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createError = (message, status = 400) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const validateRequiredString = (value, fieldName, minLength = 1) => {
  const normalized = (value || "").trim();
  if (!normalized || normalized.length < minLength) {
    throw createError(`${fieldName} не заполнено или слишком короткое`);
  }
  return normalized;
};

const validateRangeString = (value, fieldName) => {
  const normalized = (value || "").trim();
  const rangeRegex = /^\d+(\.\d+)?(-\d+(\.\d+)?)?$/;
  if (!normalized || !rangeRegex.test(normalized)) {
    throw createError(`${fieldName} должно быть в формате число или диапазон через тире`);
  }
  return normalized;
};

const validateRating = (value, fieldName) => {
  if (value === undefined || value === null || value === "") return null;
  const num = parseInt(value);
  if (Number.isNaN(num) || num < 1 || num > 5) {
    throw createError(`${fieldName} должно быть числом от 1 до 5`);
  }
  return num;
};

const parseBoolean = (value) =>
  value === true || value === "true" || value === "1" || value === 1 || value === "True";

const ensureSpeciesId = async (rawId) => {
  const speciesId = parseInt(rawId);
  if (Number.isNaN(speciesId)) {
    throw createError("Вид животного не выбран");
  }
  const species = await prisma.animal_species.findUnique({ where: { id: speciesId } });
  if (!species) {
    throw createError("Указанный вид животного не найден", 404);
  }
  return speciesId;
};

const ensureSpeciesExists = async (rawId) => {
  const speciesId = parseInt(rawId);
  if (Number.isNaN(speciesId)) {
    throw createError("Некорректный идентификатор вида");
  }
  const species = await prisma.animal_species.findUnique({ where: { id: speciesId } });
  if (!species) {
    throw createError("Вид животного не найден", 404);
  }
  return species;
};

const ensureBreedExists = async (rawId) => {
  const breedId = parseInt(rawId);
  if (Number.isNaN(breedId)) {
    throw createError("Некорректный идентификатор породы");
  }
  const breed = await prisma.animal_breeds.findUnique({ where: { id: breedId } });
  if (!breed) {
    throw createError("Порода не найдена", 404);
  }
  return breed;
};

// Species Management
exports.addSpecies = async (speciesData) => {
  const name = validateRequiredString(speciesData.name, "Название вида", 2);

  const duplicate = await prisma.animal_species.findFirst({
    where: { speciesname: { equals: name, mode: "insensitive" } },
  });
  if (duplicate) {
    throw createError("Вид животного с таким названием уже существует");
  }

  const description = speciesData.description ? speciesData.description.trim() : null;
  // speciesicon в схеме обязательное поле, поэтому сохраняем пустую строку, если иконки нет
  const icon = speciesData.icon ? speciesData.icon : "";

  return prisma.animal_species.create({
    data: {
      speciesname: name,
      speciesicon: icon,
      description,
    },
  });
};

exports.updateSpecies = async (id, speciesData) => {
  const speciesId = parseInt(id);
  await ensureSpeciesExists(speciesId);

  const name = validateRequiredString(speciesData.name, "Название вида", 2);
  const duplicate = await prisma.animal_species.findFirst({
    where: {
      id: { not: speciesId },
      speciesname: { equals: name, mode: "insensitive" },
    },
  });
  if (duplicate) {
    throw createError("Вид животного с таким названием уже существует");
  }

  const updateData = {
    speciesname: name,
  };

  if (speciesData.removeIcon) {
    updateData.speciesicon = "";
  } else if (speciesData.icon !== undefined) {
    updateData.speciesicon = speciesData.icon || "";
  }

  if (speciesData.description !== undefined) {
    updateData.description = speciesData.description?.trim() || null;
  }

  return prisma.animal_species.update({
    where: { id: speciesId },
    data: updateData,
  });
};

exports.deleteSpecies = async (id) => {
  const speciesId = parseInt(id);
  await ensureSpeciesExists(speciesId);

  const breedsCount = await prisma.animal_breeds.count({
    where: { speciesid: speciesId },
  });

  if (breedsCount > 0) {
    throw createError("Невозможно удалить вид животного: существуют породы этого вида");
  }

  await prisma.animal_species.delete({
    where: { id: speciesId },
  });
};

// Breed Management
exports.addBreed = async (breedData) => {
  const speciesId = await ensureSpeciesId(breedData.speciesId);
  const name = validateRequiredString(breedData.name, "Название породы", 2);
  const description = validateRequiredString(breedData.description, "Полное описание породы", 1);
  const shortDescription = (breedData.shortDescription || "").trim() || null;
  const weight = validateRangeString(breedData.weight, "Вес");
  const height = validateRangeString(breedData.height, "Рост");
  const lifespan = validateRangeString(breedData.lifespan, "Продолжительность жизни");
  const size = (breedData.size || "").trim();
  if (!["small", "medium", "large"].includes(size)) {
    throw createError("Размер породы выбран неверно");
  }
  const countryOfOrigin = validateRequiredString(
    breedData.countryOfOrigin,
    "Страна происхождения",
    2
  );
  const photoValue = (breedData.photo || "").trim();
  if (!photoValue) {
    throw createError("Добавьте фото породы");
  }

  const duplicate = await prisma.animal_breeds.findFirst({
    where: {
      speciesid: speciesId,
      breedname: { equals: name, mode: "insensitive" },
    },
  });
  if (duplicate) {
    throw createError("Порода с таким названием уже существует");
  }

  const breed = await prisma.animal_breeds.create({
    data: {
      speciesid: speciesId,
      breedname: name,
      short_description: shortDescription,
      description,
      photo: photoValue,
      hypoallergenicity: parseBoolean(breedData.hypoallergenicity),
      trainability: validateRating(breedData.trainability, "Дрессируемость"),
      shedding: validateRating(breedData.shedding, "Линька"),
      activity: validateRating(breedData.activity, "Активность"),
      friendliness: validateRating(breedData.friendliness, "Дружелюбность"),
      cleanliness: validateRating(breedData.cleanliness, "Чистоплотность"),
      other_animals_attitude: validateRating(
        breedData.otherAnimalsAttitude,
        "Отношение к другим животным"
      ),
      grooming: validateRating(breedData.grooming, "Потребность в уходе"),
      affection: validateRating(breedData.affection, "Ласковость"),
      fur_type: (breedData.furType || "").trim() || null,
      guard_qualities: validateRating(breedData.guardQualities, "Охранные качества"),
      grooming_needs: validateRating(breedData.groomingNeeds, "Потребность в вычесывании"),
      noise: validateRating(breedData.noise, "Шум"),
      weight,
      height,
      size,
      lifespan,
      countryoforigin: countryOfOrigin,
      pros: breedData.pros || null,
      cons: breedData.cons || null,
      gallery: breedData.gallery || null,
    },
    include: {
      species: true,
    },
  });
  return breed;
};

exports.updateBreed = async (id, breedData) => {
  const breedId = parseInt(id);
  await ensureBreedExists(breedId);

  const speciesId = await ensureSpeciesId(breedData.speciesId);
  const name = validateRequiredString(breedData.name, "Название породы", 2);
  const description = validateRequiredString(breedData.description, "Полное описание породы", 1);
  const shortDescription = breedData.shortDescription !== undefined
    ? (breedData.shortDescription || "").trim()
    : undefined;
  const weight = validateRangeString(breedData.weight, "Вес");
  const height = validateRangeString(breedData.height, "Рост");
  const lifespan = validateRangeString(breedData.lifespan, "Продолжительность жизни");
  const size = (breedData.size || "").trim();
  if (!["small", "medium", "large"].includes(size)) {
    throw createError("Размер породы выбран неверно");
  }
  const countryOfOrigin = validateRequiredString(
    breedData.countryOfOrigin,
    "Страна происхождения",
    2
  );
  const photoValue = (breedData.photo || "").trim();
  if (!photoValue) {
    throw createError("Добавьте фото породы");
  }

  const duplicate = await prisma.animal_breeds.findFirst({
    where: {
      id: { not: breedId },
      speciesid: speciesId,
      breedname: { equals: name, mode: "insensitive" },
    },
  });
  if (duplicate) {
    throw createError("Порода с таким названием уже существует");
  }

  const breed = await prisma.animal_breeds.update({
    where: { id: breedId },
    data: {
      speciesid: speciesId,
      breedname: name,
      short_description: shortDescription !== undefined ? shortDescription || null : undefined,
      description,
      photo: photoValue,
      hypoallergenicity: parseBoolean(breedData.hypoallergenicity),
      trainability: validateRating(breedData.trainability, "Дрессируемость"),
      weight,
      height,
      size,
      lifespan,
      countryoforigin: countryOfOrigin,
      shedding: validateRating(breedData.shedding, "Линька"),
      activity: validateRating(breedData.activity, "Активность"),
      friendliness: validateRating(breedData.friendliness, "Дружелюбность"),
      cleanliness: validateRating(breedData.cleanliness, "Чистоплотность"),
      other_animals_attitude: validateRating(
        breedData.otherAnimalsAttitude,
        "Отношение к другим животным"
      ),
      grooming: validateRating(breedData.grooming, "Потребность в уходе"),
      affection: validateRating(breedData.affection, "Ласковость"),
      fur_type: (breedData.furType || "").trim() || null,
      guard_qualities: validateRating(breedData.guardQualities, "Охранные качества"),
      grooming_needs: validateRating(breedData.groomingNeeds, "Потребность в вычесывании"),
      noise: validateRating(breedData.noise, "Шум"),
      pros: breedData.pros !== undefined ? breedData.pros : undefined,
      cons: breedData.cons !== undefined ? breedData.cons : undefined,
      gallery: breedData.gallery !== undefined ? breedData.gallery : undefined,
    },
    include: {
      species: true,
    },
  });
  return breed;
};

exports.deleteBreed = async (id) => {
  const breedId = parseInt(id);
  await ensureBreedExists(breedId);

  const petsCount = await prisma.pets.count({
    where: { breedid: breedId },
  });

  if (petsCount > 0) {
    throw createError("Невозможно удалить породу: существуют питомцы данной породы");
  }

  await prisma.animal_breeds.delete({
    where: { id: breedId },
  });
};

// Article Category Management
exports.addArticleCategory = async (categoryData) => {
  const name = validateRequiredString(categoryData.name, "Название категории", 2);

  const duplicate = await prisma.article_categories.findFirst({
    where: { categoryname: { equals: name, mode: "insensitive" } },
  });
  if (duplicate) {
    throw createError("Категория статей с таким названием уже существует");
  }

  return prisma.article_categories.create({
    data: {
      categoryname: name,
    },
  });
};

exports.updateArticleCategory = async (id, categoryData) => {
  const categoryId = parseInt(id);
  if (Number.isNaN(categoryId)) {
    throw createError("Некорректный идентификатор категории");
  }

  const current = await prisma.article_categories.findUnique({ where: { id: categoryId } });
  if (!current) {
    throw createError("Категория не найдена", 404);
  }

  const name = validateRequiredString(categoryData.name, "Название категории", 2);
  const duplicate = await prisma.article_categories.findFirst({
    where: { id: { not: categoryId }, categoryname: { equals: name, mode: "insensitive" } },
  });
  if (duplicate) {
    throw createError("Категория статей с таким названием уже существует");
  }

  const category = await prisma.article_categories.update({
    where: { id: categoryId },
    data: {
      categoryname: name,
    },
  });
  return category;
};

exports.deleteArticleCategory = async (id) => {
  const categoryId = parseInt(id);
  if (Number.isNaN(categoryId)) {
    throw createError("Некорректный идентификатор категории");
  }

  const current = await prisma.article_categories.findUnique({ where: { id: categoryId } });
  if (!current) {
    throw createError("Категория не найдена", 404);
  }

  const articlesCount = await prisma.article_category_relations.count({
    where: { categoryid: categoryId },
  });

  if (articlesCount > 0) {
    throw createError("Невозможно удалить категорию статей: существуют статьи этой категории");
  }

  await prisma.article_categories.delete({
    where: { id: categoryId },
  });
};

// Article Management
exports.deleteArticle = async (id) => {
  const articleId = parseInt(id);
  if (Number.isNaN(articleId)) {
    throw createError("Некорректный идентификатор статьи");
  }

  // Delete related saved articles first
  await prisma.saved_articles.deleteMany({
    where: { articleid: articleId },
  });

  await prisma.articles.delete({
    where: { id: articleId },
  });
};

// Reminder Types Management
exports.addReminderType = async (typeData) => {
  const name = validateRequiredString(typeData.name, "Название типа напоминания", 2);

  const duplicate = await prisma.reminder_types.findFirst({
    where: { rtname: { equals: name, mode: "insensitive" } },
  });
  if (duplicate) {
    throw createError("Тип напоминания с таким названием уже существует");
  }

  const type = await prisma.reminder_types.create({
    data: {
      rtname: name,
    },
  });
  return type;
};

exports.getReminderTypes = async () => {
  return await prisma.reminder_types.findMany();
};

exports.updateReminderType = async (id, typeData) => {
  const typeId = parseInt(id);
  if (Number.isNaN(typeId)) {
    throw createError("Некорректный идентификатор типа напоминания");
  }

  const current = await prisma.reminder_types.findUnique({ where: { id: typeId } });
  if (!current) {
    throw createError("Тип напоминания не найден", 404);
  }

  const name = validateRequiredString(typeData.name, "Название типа напоминания", 2);
  const duplicate = await prisma.reminder_types.findFirst({
    where: { id: { not: typeId }, rtname: { equals: name, mode: "insensitive" } },
  });
  if (duplicate) {
    throw createError("Тип напоминания с таким названием уже существует");
  }

  const type = await prisma.reminder_types.update({
    where: { id: typeId },
    data: {
      rtname: name,
    },
  });
  return type;
};

exports.deleteReminderType = async (id) => {
  const typeId = parseInt(id);
  if (Number.isNaN(typeId)) {
    throw createError("Некорректный идентификатор типа напоминания");
  }

  const current = await prisma.reminder_types.findUnique({ where: { id: typeId } });
  if (!current) {
    throw createError("Тип напоминания не найден", 404);
  }

  const remindersCount = await prisma.reminders.count({
    where: { rtid: typeId },
  });

  if (remindersCount > 0) {
    throw createError("Невозможно удалить тип напоминания: существуют напоминания с этим типом");
  }

  await prisma.reminder_types.delete({
    where: { id: typeId },
  });
};