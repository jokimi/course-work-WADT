const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

exports.register = async (username, name, email, password) => {
  const existingUser = await prisma.users.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existingUser) {
    throw new Error("Пользователь с таким email или username уже существует");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.users.create({
    data: {
      username,
      name,
      email,
      password: hashedPassword,
    },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      gender: true,
      weight_unit: true,
    },
  });

  return user;
};

exports.login = async (email, password) => {
  const user = await prisma.users.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Неверный email или пароль");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Неверный email или пароль");
  }

  const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      SECRET_KEY,
      { expiresIn: "24h" }
  );

  const userWithoutPassword = {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    telegram_chat_id: user.telegram_chat_id,
    gender: user.gender,
    weight_unit: user.weight_unit,
  };

  return { token, user: userWithoutPassword };
};

exports.getUserById = async (userId) => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
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
    throw new Error("User not found");
  }

  return user;
};