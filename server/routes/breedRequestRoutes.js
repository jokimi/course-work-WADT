const express = require("express");
const breedRequestController = require("../controllers/breedRequestController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const router = express.Router();

router.post("/", authenticateToken, upload.single('photoFile'), breedRequestController.createBreedRequest);
router.get("/", authenticateToken, requireAdmin, breedRequestController.getBreedRequests);
router.get("/my-requests", authenticateToken, breedRequestController.getUserBreedRequests);
router.patch("/:id/status", authenticateToken, requireAdmin, breedRequestController.updateBreedRequestStatus);
router.put("/:id", authenticateToken, requireAdmin, upload.single('photoFile'), breedRequestController.updateBreedRequest);

module.exports = router;