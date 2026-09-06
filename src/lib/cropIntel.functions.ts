import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateGeminiContent } from "@/lib/gemini.server";

const Input = z.object({
  crop: z.string().trim().min(1).max(60),
  stage: z.string().trim().min(1).max(60),
  location: z.string().trim().min(1).max(100),
  language: z.enum(["en", "hi", "mr", "ta", "te"]).default("en"),
});

const LANG_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi (हिन्दी)",
  mr: "Marathi (मराठी)",
  ta: "Tamil (தமிழ்)",
  te: "Telugu (తెలుగు)",
};

export type CropIntelDay = {
  date: string;
  weekday: string;
  tempMin: number;
  tempMax: number;
  humidity: number;
  windSpeed: number;
  rainMm: number;
  rainChance: number;
  icon: string;
  description: string;
};

export type CropIntelResult = {
  location: string;
  country: string;
  crop: string;
  stage: string;
  days: CropIntelDay[];
  summary: string;
  rainAlerts: string[];
  sowingHarvest: string[];
  emergencyActions: string[];
  dangers: string[];
  bestPractices: string[];
  voiceScript: string;
};

export const getCropIntel = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<CropIntelResult> => {
    const wkey = process.env.OPENWEATHER_API_KEY;

    if (!wkey) {
      throw new Error("Weather service not configured.");
    }

    // ------------------------------------------------------------
    // Geocoding
    // ------------------------------------------------------------

    async function geocode(q: string) {
      const r = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
          q,
        )}&limit=1&appid=${wkey}`,
      );

      if (!r.ok) return null;

      const j = (await r.json()) as Array<{
        lat: number;
        lon: number;
        name: string;
        country: string;
      }>;

      return j[0] ?? null;
    }

    let place = await geocode(data.location);

    // If the farmer entered a location using Telugu, Hindi,
    // Tamil, etc., convert it to an English/Latin place name.
    if (!place && /[^\u0000-\u024F]/.test(data.location)) {
      try {
        const translatedLocation = await generateGeminiContent({
          systemInstruction:
            "Reply ONLY with the standard English/Latin spelling of the Indian town or village name. No quotes. No explanation. No extra words.",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: data.location,
                },
              ],
            },
          ],
          temperature: 0,
          maxOutputTokens: 50,
        });

        const englishName = translatedLocation
          .trim()
          .split("\n")[0]
          .trim();

        if (englishName) {
          place = await geocode(englishName);
        }
      } catch {
        // Ignore location translation failure.
      }
    }

    if (!place) {
      throw new Error(
        `Couldn't find "${data.location}". Try the English name of your nearest town.`,
      );
    }

    const { lat, lon, name, country } = place;

    // ------------------------------------------------------------
    // OpenWeather forecast
    // ------------------------------------------------------------

    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${wkey}`,
    );

    if (!res.ok) {
      throw new Error("Forecast lookup failed.");
    }

    const json = (await res.json()) as {
      list: Array<{
        dt: number;
        main: {
          temp: number;
          humidity: number;
        };
        wind: {
          speed: number;
        };
        pop?: number;
        rain?: {
          "3h"?: number;
        };
        weather: Array<{
          icon: string;
          description: string;
        }>;
      }>;
    };

    // ------------------------------------------------------------
    // Group forecast data by date
    // ------------------------------------------------------------

    const buckets = new Map<string, typeof json.list>();

    for (const e of json.list) {
      const k = new Date(e.dt * 1000)
        .toISOString()
        .slice(0, 10);

      if (!buckets.has(k)) {
        buckets.set(k, []);
      }

      buckets.get(k)!.push(e);
    }

    const weekdays = [
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
    ];

    const days: CropIntelDay[] = [...buckets.entries()]
      .slice(0, 7)
      .map(([date, items]) => {
        const temps = items.map((i) => i.main.temp);
        const pops = items.map((i) => i.pop ?? 0);

        const rain = items.reduce(
          (sum, i) => sum + (i.rain?.["3h"] ?? 0),
          0,
        );

        const mid = items[Math.floor(items.length / 2)];

        return {
          date,

          weekday:
            weekdays[
              new Date(`${date}T00:00:00`).getDay()
            ],

          tempMin: Math.round(Math.min(...temps)),

          tempMax: Math.round(Math.max(...temps)),

          humidity: Math.round(
            items.reduce(
              (sum, i) => sum + i.main.humidity,
              0,
            ) / items.length,
          ),

          windSpeed: Math.round(
            (items.reduce(
              (sum, i) => sum + i.wind.speed,
              0,
            ) /
              items.length) *
              3.6,
          ),

          rainMm: Math.round(rain * 10) / 10,

          rainChance: Math.round(
            Math.max(...pops) * 100,
          ),

          icon: mid.weather[0]?.icon ?? "01d",

          description:
            mid.weather[0]?.description ?? "",
        };
      });

    // ------------------------------------------------------------
    // Prepare forecast for Gemini
    // ------------------------------------------------------------

    const lang = LANG_NAMES[data.language];

    const forecastTable = days
      .map(
        (d) =>
          `${d.weekday} ${d.date}: ${d.tempMin}-${d.tempMax}°C, humidity ${d.humidity}%, wind ${d.windSpeed} km/h, rain ${d.rainMm}mm (${d.rainChance}% chance) - ${d.description}`,
      )
      .join("\n");

    // ------------------------------------------------------------
    // Gemini agricultural analysis
    // ------------------------------------------------------------

    const system = `You are Annadata AI — an expert Indian agronomist.

Reply ONLY with strict JSON matching this structure:

{
  "summary": string,
  "rainAlerts": string[],
  "sowingHarvest": string[],
  "emergencyActions": string[],
  "dangers": string[],
  "bestPractices": string[],
  "voiceScript": string
}

Rules:

- "summary": 2-3 sentence weather and crop status summary.
- "rainAlerts": specific rain warnings tied to forecast days.
- "sowingHarvest": sowing, transplanting, or harvest recommendations for this crop and growth stage based on the forecast.
- "emergencyActions": urgent actions the farmer should take in the next 48 hours.
- "dangers": weather-driven risks such as pest outbreaks, fungal disease, lodging, heat stress, or frost.
- "bestPractices": 4-6 practical low-cost tips for this crop and growth stage.
- "voiceScript": 60-90 words in a natural spoken style covering the forecast and important actions.

Write ALL string values in ${lang}.

Use simple farmer-friendly language.
No markdown.
No extra keys.
No backticks.
Do not invent weather information that is not present in the supplied forecast.`;

    const user = `Crop: ${data.crop}

Growth stage: ${data.stage}

Location: ${name}, ${country}

7-day forecast:
${forecastTable}`;

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

      temperature: 0.3,

      maxOutputTokens: 3000,
    });

    // ------------------------------------------------------------
    // Parse Gemini response
    // ------------------------------------------------------------

    let parsed: Partial<CropIntelResult> = {};

    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        summary: raw,
        rainAlerts: [],
        sowingHarvest: [],
        emergencyActions: [],
        dangers: [],
        bestPractices: [],
        voiceScript: raw,
      };
    }

    const arr = (value: unknown): string[] => {
      if (!Array.isArray(value)) {
        return [];
      }

      return value.filter(
        (item): item is string =>
          typeof item === "string" &&
          item.trim().length > 0,
      );
    };

    return {
      location: name,

      country,

      crop: data.crop,

      stage: data.stage,

      days,

      summary: String(parsed.summary ?? ""),

      rainAlerts: arr(parsed.rainAlerts),

      sowingHarvest: arr(parsed.sowingHarvest),

      emergencyActions: arr(
        parsed.emergencyActions,
      ),

      dangers: arr(parsed.dangers),

      bestPractices: arr(
        parsed.bestPractices,
      ),

      voiceScript: String(
        parsed.voiceScript ??
          parsed.summary ??
          "",
      ),
    };
  });