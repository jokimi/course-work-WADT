const express = require("express");
const articleController = require("../controllers/articleController");
const { authenticateToken } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/", authenticateToken, articleController.getArticles);
router.get("/categories", authenticateToken, articleController.getArticleCategories);
router.post("/:id/view", authenticateToken, articleController.incrementArticleView);
router.get("/:id", authenticateToken, articleController.getArticleById);
router.post("/", authenticateToken, upload.single('imageFile'), articleController.createArticle);
router.put("/:id", authenticateToken, upload.single('imageFile'), articleController.updateArticle);
router.delete("/:id", authenticateToken, articleController.deleteArticle);
router.post("/save", authenticateToken, articleController.saveArticle);
router.delete("/save/:id", authenticateToken, articleController.unsaveArticle);
router.get("/saved/articles", authenticateToken, articleController.getSavedArticles);

module.exports = router;