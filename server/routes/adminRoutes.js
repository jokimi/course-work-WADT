const express = require("express");
const adminController = require("../controllers/adminController");
const { authenticateToken, requireAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const router = express.Router();

// Species routes
router.post("/species", authenticateToken, requireAdmin, upload.single('iconFile'), adminController.addSpecies);
router.put("/species/:id", authenticateToken, requireAdmin, upload.single('iconFile'), adminController.updateSpecies);
router.delete("/species/:id", authenticateToken, requireAdmin, adminController.deleteSpecies);

// Breed routes
router.post("/breeds", authenticateToken, requireAdmin, upload.single('photoFile'), adminController.addBreed);
router.put("/breeds/:id", authenticateToken, requireAdmin, upload.single('photoFile'), adminController.updateBreed);
router.delete("/breeds/:id", authenticateToken, requireAdmin, adminController.deleteBreed);

// Article category routes
router.post("/article-categories", authenticateToken, requireAdmin, adminController.addArticleCategory);
router.put("/article-categories/:id", authenticateToken, requireAdmin, adminController.updateArticleCategory);
router.delete("/article-categories/:id", authenticateToken, requireAdmin, adminController.deleteArticleCategory);

// Article routes
router.delete("/articles/:id", authenticateToken, requireAdmin, adminController.deleteArticle);

// Reminder type routes
router.post("/reminder-types", authenticateToken, requireAdmin, adminController.addReminderType);
router.get("/reminder-types", authenticateToken, requireAdmin, adminController.getReminderTypes);
router.put("/reminder-types/:id", authenticateToken, requireAdmin, adminController.updateReminderType);
router.delete("/reminder-types/:id", authenticateToken, requireAdmin, adminController.deleteReminderType);

module.exports = router;