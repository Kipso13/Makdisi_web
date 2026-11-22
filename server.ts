import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === "production";

interface ChatTurnInput {
  role: "user" | "assistant";
  content: string;
}

interface ReportChatRequestBody {
  messages?: ChatTurnInput[];
  studentName?: string;
  className?: string;
  viceRepName?: string;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  // Allow static GitHub Pages builds to reach this backend if VITE_CHAT_API_URL is set
  app.use((_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    next();
  });

  app.options("/api/assistant/report-chat", (_req, res) => {
    res.sendStatus(204);
  });

  app.get("/api/health", (_req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    res.json({
      ok: true,
      app: "Makdisi School Box Chat",
      aiConfigured: Boolean(apiKey && apiKey !== "MY_GEMINI_API_KEY"),
    });
  });

  app.post("/api/assistant/report-chat", async (req: Request, res: Response) => {
    const body = (req.body || {}) as ReportChatRequestBody;

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      res.status(400).json({ error: "Please include at least one message." });
      return;
    }

    const sanitizedTurns = body.messages
      .filter(
        (m): m is ChatTurnInput =>
          Boolean(m) &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim().length > 0,
      )
      .slice(-16)
      .map((m) => ({
        role: m.role,
        content: m.content.trim().slice(0, 1500),
      }));

    if (sanitizedTurns.length === 0) {
      res.status(400).json({ error: "Message content cannot be empty." });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          "AI assistant is not configured yet. Add GEMINI_API_KEY in Secrets or your .env file, or switch to Guided Intake Mode.",
      });
      return;
    }

    const studentName = (body.studentName || "Student").slice(0, 80);
    const className = (body.className || "Makdisi School Class").slice(0, 80);
    const viceRepName = (body.viceRepName || "Class Vice Representative").slice(0, 80);

    const transcriptText = sanitizedTurns
      .map((turn) => `${turn.role === "user" ? studentName : "Assistant"}: ${turn.content}`)
      .join("\n");

    const systemInstruction = `You are the Makdisi School Student Support Assistant.
You help a student (${studentName} in class ${className}) explain a school problem, facility issue, academic concern, or constructive suggestion in their own words.
Once you understand the issue, prepare a clear, respectful, actionable summary that will be sent privately to their class Vice Representative (${viceRepName}).

Guidelines:
- Keep your tone warm, supportive, concise, and practical (2 to 4 sentences per reply).
- If the student's initial description is vague or missing key context (such as classroom/location, subject/schedule, or suggested improvement), ask 1 or 2 focused follow-up questions and set readyToSubmit to false.
- As soon as you have enough clear context, set readyToSubmit to true, write a concise 2-3 sentence summary for the Vice Representative, choose an accurate category and urgency, and invite the student to review and click "Send to Vice Representative".
- Never ask for passwords or sensitive personal information.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Conversation transcript so far:\n${transcriptText}\n\nRespond to the student's latest message and update the structured report fields.`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              readyToSubmit: { type: Type.BOOLEAN },
              suggestedTitle: { type: Type.STRING },
              category: { type: Type.STRING },
              urgency: { type: Type.STRING },
              summary: { type: Type.STRING },
            },
            required: [
              "reply",
              "readyToSubmit",
              "suggestedTitle",
              "category",
              "urgency",
              "summary",
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text || "{}").trim()) as {
        reply?: string;
        readyToSubmit?: boolean;
        suggestedTitle?: string;
        category?: string;
        urgency?: string;
        summary?: string;
      };

      const allowedCategories = [
        "Academic",
        "Facilities",
        "Schedule",
        "Technology",
        "Wellbeing",
        "Suggestion",
      ];
      const allowedUrgencies = ["Low", "Medium", "High"];

      res.json({
        reply:
          parsed.reply ||
          "Thank you for sharing that. Could you tell me a little more about when or where this happens?",
        readyToSubmit: Boolean(parsed.readyToSubmit),
        suggestedTitle: (parsed.suggestedTitle || "Student Report").slice(0, 120),
        category: allowedCategories.includes(parsed.category || "")
          ? parsed.category
          : "Suggestion",
        urgency: allowedUrgencies.includes(parsed.urgency || "") ? parsed.urgency : "Medium",
        summary: (parsed.summary || "").slice(0, 800),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to reach the AI assistant right now.";
      const status =
        message.includes("403") || message.includes("API_KEY_INVALID")
          ? 403
          : message.includes("429") || message.includes("RESOURCE_EXHAUSTED")
            ? 429
            : 500;
      res.status(status).json({
        error: `AI assistant error: ${message}`,
      });
    }
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req: Request, res: Response) => {
      const indexPath = path.join(distDir, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Build artifacts not found. Run npm run build first.");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Makdisi School Box Chat server running at http://localhost:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
