const express = require("express");
const petController = require("../controllers/petController");
const { authenticateToken } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/species", authenticateToken, petController.getSpecies);
router.get("/breeds", authenticateToken, petController.getBreeds);
router.get("/breeds-all", authenticateToken, petController.getAllBreeds);
router.get("/breeds/:id", authenticateToken, petController.getBreedById);
router.post("/my-pets", authenticateToken, upload.single('avatarFile'), petController.addUserPet);
router.get("/my-pets", authenticateToken, petController.getMyPets);
router.get("/my-pets/:id", authenticateToken, petController.getPetById);
router.put("/my-pets/:id", authenticateToken, upload.single('avatarFile'), petController.updatePet);
router.delete("/my-pets/:id", authenticateToken, petController.deletePet);
router.get("/reminders", authenticateToken, petController.getReminders);
router.post("/reminders", authenticateToken, petController.createReminder);
router.patch("/reminders/:id", authenticateToken, petController.updateReminderStatus);
router.delete("/reminders/:id", authenticateToken, petController.deleteReminder);
router.delete("/reminders/completed", authenticateToken, petController.deleteCompletedReminders);
router.get("/reminder-types", authenticateToken, petController.getReminderTypes);

// Pet Logs (Daily Records)
router.post("/my-pets/:id/logs", authenticateToken, petController.createPetLog);
router.get("/my-pets/:id/logs", authenticateToken, petController.getPetLogs);
router.delete("/my-pets/:id/logs/:logId", authenticateToken, petController.deletePetLog);
router.get("/my-pets/:id/logs/stats", authenticateToken, petController.getPetLogStats);

// Breed Reviews
const reviewController = require("../controllers/reviewController");
router.get("/breeds/:breedId/reviews", authenticateToken, reviewController.getBreedReviews);
router.post("/breeds/:breedId/reviews", authenticateToken, reviewController.createBreedReview);
router.post("/reviews/:reviewId/reaction", authenticateToken, reviewController.toggleReviewReaction);
router.get("/reviews/:reviewId/reactions", authenticateToken, reviewController.getReviewReactions);

// File upload
router.post("/upload", authenticateToken, upload.single('file'), petController.uploadFile);

module.exports = router;