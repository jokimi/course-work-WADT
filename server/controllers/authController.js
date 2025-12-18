const authService = require("../services/authService");
const { validationResult } = require("express-validator");

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, name, email, password } = req.body;
  try {
    const user = await authService.register(username, name, email, password);
    res.status(201).json({ message: "Пользователь успешно зарегистрирован", user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  try {
    const { token, user } = await authService.login(email, password);

    res.status(200).json({
      token,
      user,
      message: "Login successful"
    });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

exports.logout = (req, res) => {
  res
      .clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
      .status(200)
      .json({ message: "Вы вышли из системы" });
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.userId);
    res.status(200).json(user);
  } catch (err) {
    res.status(401).json({ message: "User not found" });
  }
};