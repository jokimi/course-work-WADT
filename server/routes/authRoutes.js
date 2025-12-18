const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.post(
    "/register",
    [
        body("username").notEmpty().withMessage("UserName пользователя обязательно"),
        body("name").notEmpty().withMessage("Name пользователя обязательно"),
        body("email").isEmail().withMessage("Некорректный email"),
        body("password").isLength({ min: 6 }).withMessage("Пароль должен быть не менее 6 символов"),
    ],
    authController.register
);

router.post(
    "/login",
    [
        body("email").isEmail().withMessage("Некорректный email"),
        body("password").notEmpty().withMessage("Пароль обязателен"),
    ],
    authController.login
);

router.post("/logout", authController.logout);

// Protected routes
router.get("/me", authenticateToken, authController.getCurrentUser);

module.exports = router;