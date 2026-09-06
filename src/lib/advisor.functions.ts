import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateGeminiContent } from "@/lib/gemini.server";

const ChatInput = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(30),

  language: z.enum(["en", "hi", "mr", "ta", "te"]).optional(),

  village: z.string().max(100).optional().nullable(),

  crop: z.string().max(60).optional().nullable(),
});

const LANG_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi (हिन्दी)",
  mr: "Marathi (मराठी)",
  ta: "Tamil (தமிழ்)",
  te: "Telugu (తెలుగు)",
};

export const askAdvisor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ChatInput.parse(d))
  .handler(async ({ data }): Promise<{ reply: string }> => {
    const lang = LANG_NAMES[data.language ?? "en"];

    const ctx = [
      data.village
        ? `Farmer's location: ${data.village}.`
        : "",
      data.crop
        ? `Primary crop: ${data.crop}.`
        : "",
    ]
      .filter(Boolean)
      .join(" ");

    const system = `You are Annadata AI, an expert AI agronomist helping smallholder Indian farmers.

Answer practically and concisely (max 180 words) in ${lang}.

Cover:
- Cause
- What to do today
- Low-cost fertilizer/pesticide options, organic first
- Prevention

Use simple words.
Use short bullets when helpful.
Avoid jargon and unnecessary disclaimers.

${ctx}`;

    const contents = data.messages.map((message) => ({
      role: message.role === "assistant" ? "model" as const : "user" as const,
      parts: [
        {
          text: message.content,
        },
      ],
    }));

    const reply = await generateGeminiContent({
      systemInstruction: system,
      contents,
      temperature: 0.4,
      maxOutputTokens: 500,
    });

    return {
      reply: reply.trim(),
    };
  });