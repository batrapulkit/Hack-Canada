// server/src/routes/ai.js
import express from "express";
import { chatWithAI, parseLeadFromText, generateResortShortlist, parseBookingScreenshot } from "../controllers/aiController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticate);

router.post("/chat", chatWithAI);
router.post("/parse-lead", parseLeadFromText);
router.post("/parse-screenshot", parseBookingScreenshot);
router.post("/resort-shortlist", generateResortShortlist);

export default router;
