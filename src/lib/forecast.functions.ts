import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({ location: z.string().trim().min(1).max(100) });

export type ForecastDay = {
  date: string;          // YYYY-MM-DD
  weekday: string;       // Mon, Tue ...
  tempMin: number;
  tempMax: number;
  humidity: number;
  windSpeed: number;     // km/h
  rainMm: number;
  rainChance: number;    // 0-100
  icon: string;
  description: string;
};

export type FarmingAlert = {
  level: "info" | "warning" | "danger";
  title: string;
  message: string;
};

export type ForecastResult = {
  location: string;
  country: string;
  days: ForecastDay[];
  alerts: FarmingAlert[];
};

export const getForecast = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<ForecastResult> => {
    const key = process.env.OPENWEATHER_API_KEY;
    if (!key) throw new Error("Weather service not configured.");

    const geo = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(data.location)}&limit=1&appid=${key}`
    );
    if (!geo.ok) throw new Error("Location lookup failed.");
    const geoJson = (await geo.json()) as Array<{ lat: number; lon: number; name: string; country: string }>;
    if (!geoJson.length) throw new Error(`Couldn't find "${data.location}".`);
    const { lat, lon, name, country } = geoJson[0];

    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${key}`
    );
    if (!res.ok) throw new Error("Forecast lookup failed.");
    const json = await res.json() as {
      list: Array<{
        dt: number;
        main: { temp: number; temp_min: number; temp_max: number; humidity: number };
        wind: { speed: number };
        pop?: number;
        rain?: { "3h"?: number };
        weather: Array<{ icon: string; description: string }>;
      }>;
    };

    const buckets = new Map<string, typeof json.list>();
    for (const entry of json.list) {
      const d = new Date(entry.dt * 1000);
      const key = d.toISOString().slice(0, 10);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(entry);
    }

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const days: ForecastDay[] = [...buckets.entries()].slice(0, 7).map(([date, items]) => {
      const temps = items.map((i) => i.main.temp);
      const pops = items.map((i) => i.pop ?? 0);
      const rain = items.reduce((s, i) => s + (i.rain?.["3h"] ?? 0), 0);
      const mid = items[Math.floor(items.length / 2)];
      return {
        date,
        weekday: weekdays[new Date(date + "T00:00:00").getDay()],
        tempMin: Math.round(Math.min(...temps)),
        tempMax: Math.round(Math.max(...temps)),
        humidity: Math.round(items.reduce((s, i) => s + i.main.humidity, 0) / items.length),
        windSpeed: Math.round((items.reduce((s, i) => s + i.wind.speed, 0) / items.length) * 3.6),
        rainMm: Math.round(rain * 10) / 10,
        rainChance: Math.round(Math.max(...pops) * 100),
        icon: mid.weather[0]?.icon ?? "01d",
        description: mid.weather[0]?.description ?? "",
      };
    });

    // Generate farming alerts
    const alerts: FarmingAlert[] = [];
    const heavyRain = days.find((d) => d.rainMm > 20);
    if (heavyRain) {
      alerts.push({
        level: "warning",
        title: "Heavy rainfall expected",
        message: `${heavyRain.rainMm} mm of rain forecast on ${heavyRain.weekday}. Delay spraying and ensure drainage.`,
      });
    }
    const hot = days.find((d) => d.tempMax >= 38);
    if (hot) {
      alerts.push({
        level: "danger",
        title: "Heatwave risk",
        message: `Highs of ${hot.tempMax}°C on ${hot.weekday}. Irrigate early morning and protect young plants.`,
      });
    }
    const cold = days.find((d) => d.tempMin <= 4);
    if (cold) {
      alerts.push({
        level: "warning",
        title: "Frost / cold stress risk",
        message: `Lows near ${cold.tempMin}°C on ${cold.weekday}. Cover sensitive crops overnight.`,
      });
    }
    const drySpell = days.slice(0, 5).every((d) => d.rainChance < 20);
    if (drySpell) {
      alerts.push({
        level: "info",
        title: "Dry spell ahead",
        message: "Less than 20% rain chance for 5 days. Plan irrigation accordingly.",
      });
    }
    const sprayDay = days.find((d) => d.rainChance < 20 && d.windSpeed < 15);
    if (sprayDay) {
      alerts.push({
        level: "info",
        title: "Best day to spray",
        message: `${sprayDay.weekday} looks calm and dry — ideal for pesticide / foliar spray.`,
      });
    }

    return { location: name, country, days, alerts };
  });
