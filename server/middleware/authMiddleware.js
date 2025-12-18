const jwt = require("jsonwebtoken");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "Требуется авторизация" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: "Неверный токен" });
  }
};

exports.requireAdmin = async (req, res, next) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.userId },
      select: { role: true },
    });

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Требуются права администратора" });
    }

    next();
  } catch (error) {
    console.error("Ошибка при проверке роли:", error);
    res.status(500).json({ message: "Ошибка проверки прав доступа" });
  }
};