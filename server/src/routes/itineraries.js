// server/src/routes/itineraries.js
import express from "express";
import {
  generateItinerary,
  getItineraries,
  getItinerary,
  updateItinerary,
  deleteItinerary,
  createItinerary
} from "../controllers/itineraryController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticate);

router.post("/generate", generateItinerary);
router.post("/", createItinerary);
router.get("/", getItineraries);
router.get("/:id", getItinerary);
router.patch("/:id", updateItinerary);
router.delete("/:id", deleteItinerary);

// Itinerary Items
import { createItineraryItem, updateItineraryItem, deleteItineraryItem } from "../controllers/itineraryController.js";
router.post("/:id/items", createItineraryItem);
router.put("/items/:itemId", updateItineraryItem);
router.delete("/items/:itemId", deleteItineraryItem);

export default router;
