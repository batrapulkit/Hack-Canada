import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Hack to access model list if not directly exposed in main class helper
    // Actually, standard usage is to just try a known model, but for debugging we can try to fetch them if the content API supports it
    // The Node SDK doesn't have a direct listModels() method on the top level class usually, but the underlying API does.
    // We can try to use a model to generate content and see if it works, or check for specific error details.
    // HOWEVER, let's try the `gemini-pro` first as a fallback check.

    console.log("Checking gemini-1.5-flash...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-1.5-flash");
        return;
    } catch (e) {
        console.log("Failed gemini-1.5-flash: " + e.message);
    }

    console.log("Checking gemini-1.5-flash-001...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-1.5-flash-001");
        return;
    } catch (e) {
        console.log("Failed gemini-1.5-flash-001: " + e.message);
    }

    console.log("Checking gemini-pro...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-pro");
        return;
    } catch (e) {
        console.log("Failed gemini-pro: " + e.message);
    }
}

listModels();
