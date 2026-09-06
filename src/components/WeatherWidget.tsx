import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Cloud, Droplets, Wind, CloudRain, Loader2, MapPin, Thermometer, Map as MapIcon, LocateFixed } from "lucide-react";
import { getWeather, type WeatherData } from "@/lib/weather.functions";
import { logActivity } from "@/lib/activity.functions";
import { getCurrentActivityUserId, getOrCreateActivitySessionId } from "@/lib/activity-client";
import { useI18n } from "@/lib/i18n";
import { VoiceInput } from "@/components/VoiceInput";

const HL_LANG: Record<string, string> = { en: "en", hi: "hi", mr: "mr", ta: "ta", te: "te" };

type Query = { kind: "text"; location: string } | { kind: "coords"; lat: number; lon: number };

export function WeatherWidget({ initialLocation }: { initialLocation?: string }) {
  const { t, lang } = useI18n();
  const [location, setLocation] = useState(initialLocation ?? "");
  const [submitted, setSubmitted] = useState<Query | null>(
    initialLocation ? { kind: "text", location: initialLocation } : null,
  );
  const [locating, setLocating] = useState(false);
  const fetchWeather = useServerFn(getWeather);
  const log = useServerFn(logActivity);

  const q = useQuery<WeatherData>({
    queryKey: ["weather", submitted],
    queryFn: () =>
      fetchWeather({
        data:
          submitted!.kind === "text"
            ? { location: submitted!.location }
            : { lat: submitted!.lat, lon: submitted!.lon },
      }),
    enabled: !!submitted,
    retry: false,
    staleTime: 1000 * 60 * 10,
  });

  function trackQuery(query: string) {
    getCurrentActivityUserId()
      .then((userId) =>
        log({
          data: {
            event_type: "weather_lookup",
            path: window.location.pathname,
            query,
            session_id: getOrCreateActivitySessionId(),
            user_id: userId,
          },
        }),
      )
      .catch(() => {});
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!location.trim()) return;
    const query = location.trim();
    setSubmitted({ kind: "text", location: query });
    trackQuery(query);
  }

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error(t("geoUnsupported"));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setSubmitted({ kind: "coords", lat: latitude, lon: longitude });
        setLocation("");
        trackQuery(`coords:${latitude.toFixed(3)},${longitude.toFixed(3)}`);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        toast.error(err.message || t("geoDenied"));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  const hl = HL_LANG[lang] ?? "en";

  return (
    <Card className="overflow-hidden border-border/60 shadow-soft">
      <CardHeader className="bg-gradient-sky">
        <CardTitle className="flex items-center gap-2 font-display"><Cloud className="h-5 w-5" /> {t("weather")}</CardTitle>
        <CardDescription>{t("hyperlocal")}</CardDescription>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        <form onSubmit={onSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("villagePlaceholder")}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-9"
              maxLength={100}
            />
          </div>
          <VoiceInput onTranscript={(txt) => setLocation(txt.trim())} title={t("speakToType")} />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={useMyLocation}
            disabled={locating}
            title={t("useMyLocation")}
            aria-label={t("useMyLocation")}
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
          </Button>
          <Button type="submit" disabled={q.isFetching}>
            {q.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : t("checkBtn")}
          </Button>
        </form>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={useMyLocation}
          disabled={locating}
          className="w-full justify-center gap-2 text-primary hover:text-primary"
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
          {t("useMyLocation")}
        </Button>

        {q.isError && (
          <p className="text-sm text-destructive">{(q.error as Error).message}</p>
        )}

        {q.data && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-end justify-between">
              <div>
                <div className="font-display text-5xl font-bold text-primary">{q.data.temperature}°</div>
                <div className="text-sm text-muted-foreground capitalize">{q.data.description}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{q.data.location}{q.data.country ? `, ${q.data.country}` : ""}</div>
              </div>
              <img
                src={`https://openweathermap.org/img/wn/${q.data.icon}@2x.png`}
                alt={q.data.description}
                className="h-20 w-20 -mr-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat icon={Thermometer} label={t("feelsLikeLbl")} value={`${q.data.feelsLike}°`} />
              <Stat icon={Droplets} label={t("humidityLbl")} value={`${q.data.humidity}%`} />
              <Stat icon={CloudRain} label={t("rainChanceLbl")} value={`${q.data.rainChance}%`} />
              <Stat icon={Wind} label={t("windLbl")} value={`${q.data.windSpeed} km/h`} />
            </div>

            <div className="rounded-xl overflow-hidden border border-border/60 bg-muted/40">
              <div className="flex items-center gap-2 px-3 py-2 text-sm">
                <MapIcon className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium text-foreground">{t("fieldLocation")}</div>
                  <div className="text-xs text-muted-foreground">{t("fieldLocationDesc")}</div>
                </div>
              </div>
              <iframe
                key={`${q.data.lat}-${q.data.lon}-${hl}`}
                title={t("fieldLocation")}
                src={`https://maps.google.com/maps?q=${q.data.lat},${q.data.lon}&z=13&hl=${hl}&output=embed`}
                className="w-full h-56 border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        )}

        {!submitted && !q.data && (
          <p className="text-sm text-muted-foreground text-center py-6">
            {t("enterVillageHint")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Cloud; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className="font-display text-xl font-semibold text-foreground mt-1">{value}</div>
    </div>
  );
}
