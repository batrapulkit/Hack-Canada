// server/src/config/gemini.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY in .env');
  process.exit(1);
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export function getModel(modelName) {
  const model = modelName || process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
  return genAI.getGenerativeModel({ model });
}

export function getSearchEnabledModel(modelName) {
  const model = modelName || process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'; // Standardize on 2.5-flash-lite
  return genAI.getGenerativeModel({
    model,
    tools: [{ googleSearch: {} }]
  });
}

console.log('✅ Gemini AI initialized (gemini series ready)');
