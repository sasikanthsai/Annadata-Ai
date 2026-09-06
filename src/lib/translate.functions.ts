import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateGeminiContent } from "@/lib/gemini.server";

const Input = z.object({
  strings: z.array(z.string().min(1).max(1000)).min(1).max(40),
  targetLang: z.enum(["en", "hi", "mr", "ta", "te"]),
});

const LANG_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi (हिन्दी)",
  mr: "Marathi (मराठी)",
  ta: "Tamil (தமிழ்)",
  te: "Telugu (తెలుగు)",
};

export const translateStrings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<{ translations: string[] }> => {
    // English requires no AI translation.
    if (data.targetLang === "en") {
      return {
        translations: data.strings,
      };
    }

    const system = `You are a precise translator for an Indian agriculture app.

Translate every input string into ${LANG_NAMES[data.targetLang]}.

Rules:
- Preserve numbers exactly.
- Preserve currency symbols such as ₹.
- Preserve units such as ha, acre, %, kg, ml, etc.
- Preserve URLs.
- Preserve proper nouns of official government scheme names.
- Keep the original meaning.
- Do not add explanations.
- Do not remove any input strings.
- Return STRICT JSON only.

The response MUST have exactly this structure:
{"translations":["...", "..."]}

The translations array MUST contain exactly the same number of items as the input strings, in exactly the same order.`;

    const user = JSON.stringify({
      strings: data.strings,
    });

    const raw = await generateGeminiContent({
      systemInstruction: system,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: user,
            },
          ],
        },
      ],
      responseMimeType: "application/json",
      temperature: 0.1,
      maxOutputTokens: 3000,
    });

    let parsed: {
      translations?: unknown;
    } = {};

    try {
      parsed = JSON.parse(raw);
    } catch {
      // If Gemini returns invalid JSON, fall back to original strings.
      parsed = {};
    }

    const arr = Array.isArray(parsed.translations)
      ? parsed.translations
      : [];

    const translations = data.strings.map((original, index) => {
      const translated = arr[index];

      return typeof translated === "string" && translated.trim()
        ? translated.trim()
        : original;
    });

    return {
      translations,
    };
  });