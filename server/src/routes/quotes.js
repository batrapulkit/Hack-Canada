// server/src/routes/quotes.js
import express from "express";
import {
    getQuotes,
    createQuote,
    updateQuote, // Import new function
    updateQuoteStatus,
    convertQuoteToInvoice,
    deleteQuote
} from "../controllers/quoteController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticate);

router.get("/", getQuotes);
router.post("/", createQuote);
router.patch("/:id", updateQuote); // General Update
router.patch("/:id/status", updateQuoteStatus);
router.post("/:id/convert", convertQuoteToInvoice);
router.delete("/:id", deleteQuote);

export default router;
