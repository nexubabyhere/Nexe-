import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in the environment.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// SSE Streaming Chat endpoint
app.post("/api/chat/stream", async (req, res) => {
  const {
    messages = [],
    systemInstruction,
    searchGrounding = false,
    temperature = 0.7,
    model = "gemini-3.7-flash",
  } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Messages array is required." });
    return;
  }

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  try {
    const ai = getGenAI();

    // Format contents according to @google/genai format
    // Map messages into Content objects with parts
    const contents = messages.map((msg: any) => {
      const parts: any[] = [];

      // If user uploaded image/file attachments
      if (msg.attachments && Array.isArray(msg.attachments)) {
        for (const att of msg.attachments) {
          if (att.data && att.mimeType) {
            // Remove data URI prefix if present
            const cleanBase64 = att.data.includes(";base64,")
              ? att.data.split(";base64,")[1]
              : att.data;

            parts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: cleanBase64,
              },
            });
          }
        }
      }

      if (msg.content) {
        parts.push({
          text: msg.content,
        });
      } else if (parts.length === 0) {
        parts.push({
          text: "...",
        });
      }

      return {
        role: msg.role === "user" ? "user" : "model",
        parts,
      };
    });

    const tools: any[] = [];
    if (searchGrounding) {
      tools.push({ googleSearch: {} });
    }

    const config: any = {
      temperature: typeof temperature === "number" ? temperature : 0.7,
    };

    if (systemInstruction && typeof systemInstruction === "string" && systemInstruction.trim()) {
      config.systemInstruction = systemInstruction.trim();
    }

    if (tools.length > 0) {
      config.tools = tools;
    }

    const streamResponse = await ai.models.generateContentStream({
      model: model || "gemini-3.7-flash",
      contents,
      config,
    });

    for await (const chunk of streamResponse) {
      const text = chunk.text || "";
      const groundingChunks =
        chunk.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      const payload = {
        text,
        groundingChunks: groundingChunks.map((g: any) => {
          if (g.web) {
            return { uri: g.web.uri, title: g.web.title };
          }
          if (g.maps) {
            return { uri: g.maps.uri, title: g.maps.title };
          }
          return g;
        }),
      };

      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("Error in /api/chat/stream:", error);
    const errorPayload = {
      error: error.message || "An error occurred while generating response.",
    };
    res.write(`data: ${JSON.stringify(errorPayload)}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

// Title generation endpoint for conversation labeling
app.post("/api/chat/generate-title", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    res.status(400).json({ error: "Message is required." });
    return;
  }

  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `Generate a concise 3 to 6 word title summarizing this message. Do NOT use quotation marks, punctuation, or generic prefixes. Output only the title text:\n\n"${message}"`,
      config: {
        temperature: 0.2,
      },
    });

    const title = response.text?.trim()?.replace(/["']/g, "") || "New Chat";
    res.json({ title });
  } catch (err: any) {
    console.error("Error generating title:", err);
    res.json({ title: message.slice(0, 30) + (message.length > 30 ? "..." : "") });
  }
});

// Text-to-Speech endpoint using gemini-3.1-flash-tts-preview
app.post("/api/tts", async (req, res) => {
  const { text, voice = "Kore" } = req.body;
  if (!text) {
    res.status(400).json({ error: "Text is required." });
    return;
  }

  try {
    const ai = getGenAI();
    const cleanText = text.replace(/```[\s\S]*?```/g, "Code block omitted.").slice(0, 1000);

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice || "Kore",
            },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio returned from TTS model.");
    }

    res.json({ audio: base64Audio });
  } catch (error: any) {
    console.error("TTS Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate speech." });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
