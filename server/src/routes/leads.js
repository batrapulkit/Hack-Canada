// server/src/routes/leads.js
import express from "express";
import {
  getLeads,
  createLead,
  updateLead,
  deleteLead,
  convertLeadToClient,
  getLeadAIScore,
  getLead,
  getLeadStats,
  qualifyLead,
  getFollowUpSuggestions
} from "../controllers/leadController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticate, getLeads);
router.post("/", authenticate, createLead);
router.get("/stats/all", authenticate, getLeadStats);
router.get("/:id", authenticate, getLead);
router.patch("/:id", authenticate, updateLead);
router.delete("/:id", authenticate, deleteLead);

router.post("/:id/convert", authenticate, convertLeadToClient);
router.get("/:id/ai-score", authenticate, getLeadAIScore);
router.get("/:id/qualify", authenticate, qualifyLead);
router.get("/:id/follow-up", authenticate, getFollowUpSuggestions);

export default router;
