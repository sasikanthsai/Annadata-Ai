import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z
  .object({
    location: z.string().trim().min(1).max(100).optional(),
    lat: z.number().min(-90).max(90).optional(),
    lon: z.number().min(-180).max(180).optional(),
  })
  .refine((v) => !!v.location || (typeof v.lat === "number" && typeof v.lon === "number"), {
    message: "Provide a location or coordinates.",
  });

export type WeatherData = {
  location: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  rainChance: number;
  description: string;
  icon: string;
  lat: number;
  lon: number;
};

export const getWeather = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<WeatherData> => {
    const key = process.env.OPENWEATHER_API_KEY;
    if (!key) throw new Error("Weather service is not configured.");

    let lat: number;
    let lon: number;
    let name: string;
    let country: string;

    if (typeof data.lat === "number" && typeof data.lon === "number") {
      lat = data.lat;
      lon = data.lon;
      const rev = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${key}`,
      );
      const revJson = rev.ok ? ((await rev.json()) as Array<{ name: string; country: string }>) : [];
      name = revJson[0]?.name ?? "Current location";
      country = revJson[0]?.country ?? "";
    } else {
      const geo = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(data.location!)}&limit=1&appid=${key}`,
      );
      if (!geo.ok) throw new Error("Failed to look up location.");
      const geoJson = (await geo.json()) as Array<{
        lat: number; lon: number; name: string; country: string;
      }>;
      if (!geoJson.length) throw new Error(`Couldn't find "${data.location}".`);
      ({ lat, lon, name, country } = geoJson[0]);
    }

    const [current, forecast] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${key}`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&cnt=8&appid=${key}`),
    ]);
    if (!current.ok) throw new Error("Weather lookup failed.");
    const cur = await current.json();

    let rainChance = 0;
    if (forecast.ok) {
      const f = await forecast.json();
      const pops: number[] = (f.list || []).map((x: { pop?: number }) => x.pop ?? 0);
      rainChance = pops.length ? Math.round(Math.max(...pops) * 100) : 0;
    }

    return {
      location: name,
      country,
      temperature: Math.round(cur.main.temp),
      feelsLike: Math.round(cur.main.feels_like),
      humidity: cur.main.humidity,
      windSpeed: Math.round(cur.wind.speed * 3.6),
      rainChance,
      description: cur.weather?.[0]?.description ?? "",
      icon: cur.weather?.[0]?.icon ?? "01d",
      lat,
      lon,
    };
  });
