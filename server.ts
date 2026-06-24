import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limits for voice recordings and image payloads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Endpoints first
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Transcription using Gemini 3.5-flash
  app.post("/api/transcribe", async (req, res) => {
    try {
      const { audio, mimeType } = req.body;
      if (!audio) {
        return res.status(400).json({ error: "No audio data provided" });
      }
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not defined. Please configure secrets in the panel." });
      }

      const audioPart = {
        inlineData: {
          data: audio,
          mimeType: mimeType || "audio/webm",
        }
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          audioPart,
          "Please listen to this voice recording of a person narrating their dream. Transcribe it verbatim with high fidelity, correcting spelling, punctuation, and structural flow. Return ONLY the final transcription, with no explanations, metadata tags, introduction, or pleasantries."
        ],
      });

      res.json({ transcription: response.text || "" });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err?.message || "Failed to transcribe voice recording." });
    }
  });

  // Archetypes and symbols analysis
  const interpretationSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      emotionalTheme: { type: Type.STRING },
      analysis: { type: Type.STRING },
      archetypes: {
         type: Type.ARRAY,
         items: {
           type: Type.OBJECT,
           properties: {
             name: { type: Type.STRING },
             explanation: { type: Type.STRING },
           },
           required: ["name", "explanation"]
         }
      },
      symbols: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            meaning: { type: Type.STRING },
          },
          required: ["name", "meaning"]
        }
      },
      reflectionQuestions: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    },
    required: ["title", "emotionalTheme", "analysis", "archetypes", "symbols", "reflectionQuestions"]
  };

  app.post("/api/interpret", async (req, res) => {
    try {
      const { dreamText } = req.body;
      if (!dreamText) {
        return res.status(400).json({ error: "No dream text provided" });
      }
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not defined. Please configure secrets." });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze this dream narration. Identify major Jungian psychological archetypes and evocative symbols, drawing on classical and analytical dream theory. Return the result strictly in JSON.
Dream Text:
"${dreamText}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: interpretationSchema,
        }
      });

      res.json(JSON.parse(response.text || "{}"));
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err?.message || "Failed to analyze dream." });
    }
  });

  // Surrealist Image Generation with size and aspect ratio
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt, size, aspectRatio } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "No prompt provided" });
      }
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not defined." });
      }

      const visualPrompt = `A surrealist oil painting in the style of René Magritte and Salvador Dalí, representing the emotional theme: "${prompt}". Ethereal details, psychological symbolism, high fidelity masterpiece, deep colors.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [
            { text: visualPrompt }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || "1:1",
            imageSize: size || "1K"
          }
        }
      });

      if (!response.candidates?.[0]?.content?.parts) {
        throw new Error("No visual generation parts found.");
      }

      let imageUrl = "";
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!imageUrl) {
        throw new Error("Failed to extract Base64 image from the model response parts.");
      }

      res.json({ imageUrl });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err?.message || "Failed to generate surrealist dream image." });
    }
  });

  // Chatbot for Symbol interpretation
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, dreamContext } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages array." });
      }
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not defined." });
      }

      const history = messages.slice(0, -1).map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }]
      }));

      const lastMessage = messages[messages.length - 1]?.text || "";

      const systemInstruction = `You are a professional Jungian depth psychologist & expert symbol analyst:
Understand this dream context & the analytical interpretation we has generated so far:
---
${dreamContext}
---

Your role:
1. Actively guide the user to explore symbols, characters, feelings, or elements in their dream.
2. Ground your explanations in depth psychology (e.g., Anima/Animus, Shadow, Personal/Collective Unconscious, archetypal motifs).
3. Be curious, comforting, analytical, and insightful. Ask open-ended questions to probe their waking life associations with those symbols.
4. Keep replies relatively concise, highly engaging, and formatted in pristine Markdown.`;

      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        history: history,
        config: {
          systemInstruction: systemInstruction,
        }
      });

      const response = await chat.sendMessage({ message: lastMessage });
      res.json({ reply: response.text });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err?.message || "Failed to connect to dream companion." });
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
