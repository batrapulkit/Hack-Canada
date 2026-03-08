import express from "express";
import {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getClientStats,
  createBulkClients
} from "../controllers/clientController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getClients);
router.get("/stats", getClientStats);
router.get("/:id", getClient);
router.post("/", createClient);
router.post("/bulk", createBulkClients);
router.patch("/:id", updateClient);
router.delete("/:id", deleteClient);

export default router;
