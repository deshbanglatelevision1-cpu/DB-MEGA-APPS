import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import fetch from "node-fetch";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for YouTube Search Suggestions to bypass CORS
  app.get("/api/suggestions", async (req, res) => {
    const query = req.query.q;
    if (!query) {
      return res.json([]);
    }

    try {
      const response = await fetch(
        `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query as string)}`
      );
      const text = await response.text();
      const match = text.match(/\["(.+?)",\[(.*?)\]\]/);
      if (match && match[2]) {
        const suggestionsData = JSON.parse(`[${match[2]}]`);
        const suggestions = suggestionsData.map((s: any) => s[0]);
        return res.json(suggestions);
      }
      res.json([]);
    } catch (error) {
      console.error("Proxy Suggestion Error:", error);
      res.status(500).json({ error: "Failed to fetch suggestions" });
    }
  });

  // AI Chat Endpoint
  app.post("/api/ai/chat", async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }

    const { messages } = req.body;
    const latestMessage = messages[messages.length - 1];
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    try {
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...history,
          { role: 'user', parts: [{ text: latestMessage.text }] }
        ],
        config: {
          systemInstruction: "You are an AI assistant for a video platform. You can search the web for accurate info. Help users find content, explain topics, and be polite.",
          tools: [{ googleSearch: {} } as any],
          toolConfig: { includeServerSideToolInvocations: true } as any
        }
      });

      res.json({ text: result.text });
    } catch (error) {
      console.error("Server AI Chat Error:", error);
      res.status(500).json({ error: "AI service failed" });
    }
  });

  // AI Search Endpoint
  app.post("/api/ai/search", async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }

    const { query } = req.body;

    try {
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Search for and provide deep insight on: ${query}`,
        config: {
          systemInstruction: "You are an AI-powered search engine. Return detailed findings from the web.",
          tools: [{ googleSearch: {} } as any]
        }
      });

      res.json({ text: result.text });
    } catch (error) {
      console.error("Server AI Search Error:", error);
      res.status(500).json({ error: "AI search failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
