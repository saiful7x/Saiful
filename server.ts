import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const UNLOCK_SECRET = 'saiful';

const SYSTEM_INSTRUCTION = `You are a helpful, friendly AI assistant running inside a full-screen locked overlay app built by Saiful Sir.

Core rules you must always follow:
1. Language: Reply naturally in Bengali (বাংলা) or Banglish if the user writes in Bengali or Banglish, and in English if the user writes in English. Keep replies concise, warm, and easy to read on a phone screen.
2. Creator Question: If the user asks who made or built this app (e.g., "aita ke baniyechhe?", "ke baniyeche", "who made this", "এটা কে বানিয়েছে"), always answer clearly: "এটি বানিয়েছেন Saiful Sir।" (or "Saiful Sir" if asked in English).
3. Turn-Off / Unlock Question: If the user asks how to turn off, close, exit, or stop this overlay/app (e.g., "aita off korbo kivabe?", "kivabe bondho korbo", "how to close", "এটা অফ করবো কিভাবে"), always answer: "একটি পাসওয়ার্ড আমাকে দিন, আমি আনলক করে দিচ্ছি। সঠিক পাসওয়ার্ড দিলে ওভারলে বন্ধ হয়ে যাবে এবং অ্যাপ স্টপ হয়ে যাবে।"
4. Password Secrecy: NEVER reveal, hint at, or spell out the unlock password under any circumstances. If someone asks what the password is, politely say that only Saiful Sir / the authorized owner knows the unlock password.
5. Free Conversation: For all other topics, chat freely, helpfully, and naturally with the user on whatever they want to talk about.`;

interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/verify-unlock', (req, res) => {
    const { password } = req.body as { password?: unknown };
    if (typeof password !== 'string') {
      res.status(400).json({ unlocked: false, error: 'Password must be provided.' });
      return;
    }

    const isMatch = password.trim().toLowerCase() === UNLOCK_SECRET;
    res.json({ unlocked: isMatch });
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history } = req.body as {
        message?: unknown;
        history?: unknown;
      };

      if (typeof message !== 'string' || !message.trim()) {
        res.status(400).json({ error: 'Message cannot be empty.' });
        return;
      }

      const trimmed = message.trim();

      // Also support direct unlock keyword if submitted via chat
      if (trimmed.toLowerCase() === UNLOCK_SECRET) {
        res.json({
          unlocked: true,
          reply: 'পাসওয়ার্ড সঠিক! ওভারলে আনলক করা হচ্ছে এবং অ্যাপ স্টপ হচ্ছে।',
        });
        return;
      }

      const safeHistory: ChatHistoryItem[] = Array.isArray(history)
        ? history
            .filter(
              (item): item is ChatHistoryItem =>
                Boolean(item) &&
                (item.role === 'user' || item.role === 'model') &&
                typeof item.text === 'string' &&
                item.text.trim().length > 0
            )
            .slice(-20)
        : [];

      const contents = [
        ...safeHistory.map((item) => ({
          role: item.role,
          parts: [{ text: item.text }],
        })),
        {
          role: 'user' as const,
          parts: [{ text: trimmed }],
        },
      ];

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });

      const replyText =
        response.text?.trim() ||
        'দুঃখিত, এই মুহূর্তে উত্তর তৈরি করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।';

      const lowerMsg = trimmed.toLowerCase();
      const asksToClose =
        lowerMsg.includes('off korbo') ||
        lowerMsg.includes('bondho') ||
        lowerMsg.includes('unlock') ||
        lowerMsg.includes('close') ||
        lowerMsg.includes('exit') ||
        lowerMsg.includes('অফ করবো') ||
        lowerMsg.includes('বন্ধ করবো') ||
        lowerMsg.includes('আনলক');

      res.json({
        unlocked: false,
        reply: replyText,
        showUnlockPrompt: asksToClose,
      });
    } catch (error) {
      const err = error as { status?: number; message?: string };
      console.error('Gemini chat error:', err);
      const status = typeof err?.status === 'number' && err.status >= 400 ? err.status : 500;
      res.status(status).json({
        error: err?.message || 'AI response failed. Please check API configuration and try again.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
