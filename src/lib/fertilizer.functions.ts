import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateGeminiContent } from "@/lib/gemini.server";

const Input = z.object({
  product: z.string().min(2).max(80),
  language: z.enum(["en", "hi", "mr", "ta", "te"]).optional(),
});

const LANG_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  ta: "Tamil",
  te: "Telugu",
};

export type FertilizerOffer = {
  platform: string;
  pack: string;
  price_range_inr: string;
  note: string;
};

export type FertilizerPriceResult = {
  product: string;
  summary: string;
  offers: FertilizerOffer[];
};

export const getFertilizerPrices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<FertilizerPriceResult> => {
    const lang = LANG_NAMES[data.language ?? "en"];

    const system = `You estimate typical Indian online retail prices for farm inputs such as fertilizers, pesticides, seeds, and growth promoters.

Return typical current market price RANGES in INR for the given product on these Indian platforms:
- Amazon India
- Flipkart
- BigHaat
- AgriBegri
- IndiaMART

Use the most common retail pack size for each platform.

Prices are approximate estimates, never exact.

Write the "summary" and every "note" in ${lang}.
Use simple farmer-friendly words.
Keep each note to a maximum of 20 words.

Return STRICT JSON only using this structure:

{
  "summary": "short summary",
  "offers": [
    {
      "platform": "platform name",
      "pack": "pack size",
      "price_range_inr": "₹xxx - ₹xxx",
      "note": "short farmer-friendly note"
    }
  ]
}

The offers array should contain the platforms for which you can provide a reasonable estimate.`;

    const user = `Product: ${data.product}`;

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
      temperature: 0.2,
      maxOutputTokens: 2000,
    });

    let parsed: {
      summary?: unknown;
      offers?: unknown;
    } = {};

    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("Price lookup unavailable.");
    }

    const offers: FertilizerOffer[] = Array.isArray(parsed.offers)
      ? parsed.offers
          .filter(
            (offer): offer is Record<string, unknown> =>
              typeof offer === "object" &&
              offer !== null,
          )
          .map((offer) => ({
            platform:
              typeof offer.platform === "string"
                ? offer.platform
                : "",
            pack:
              typeof offer.pack === "string"
                ? offer.pack
                : "",
            price_range_inr:
              typeof offer.price_range_inr === "string"
                ? offer.price_range_inr
                : "",
            note:
              typeof offer.note === "string"
                ? offer.note
                : "",
          }))
          .filter(
            (offer) =>
              offer.platform &&
              offer.pack &&
              offer.price_range_inr,
          )
      : [];

    return {
      product: data.product,
      summary:
        typeof parsed.summary === "string"
          ? parsed.summary
          : "",
      offers,
    };
  });