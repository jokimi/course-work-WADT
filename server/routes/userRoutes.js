const express = require("express");
const userController = require("../controllers/userController");
const { authenticateToken } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/current", authenticateToken, userController.getCurrentUser);
router.get("/:userId", authenticateToken, userController.getUserById);
router.put("/current", authenticateToken, upload.single('avatar'), userController.updateUser);
router.put("/current/password", authenticateToken, userController.updatePassword);

module.exports = router;