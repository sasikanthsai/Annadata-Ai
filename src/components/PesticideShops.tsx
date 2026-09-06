import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Store, ExternalLink, Loader2, Search, LocateFixed } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { VoiceInput } from "@/components/VoiceInput";
import { toast } from "sonner";

type Shop = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distanceKm: number;
  address?: string;
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function fetchShopsAround(lat: number, lon: number): Promise<Shop[]> {
  // Progressive radius: 10 → 25 → 50 → 100 km until we find something
  const radii = [10000, 25000, 50000, 100000];
  for (const radius of radii) {
    const q = `[out:json][timeout:25];
(
  node["shop"="agrarian"](around:${radius},${lat},${lon});
  way["shop"="agrarian"](around:${radius},${lat},${lon});
  node["shop"="farm"](around:${radius},${lat},${lon});
  node["shop"="garden_centre"](around:${radius},${lat},${lon});
  node["shop"="doityourself"]["name"~"agri|pestic|fertil|krishi|seed|rythu|raithu",i](around:${radius},${lat},${lon});
  node["name"~"pestic|fertil|krishi|agri|seed|rythu|raithu|agro|nursery",i](around:${radius},${lat},${lon});
  way["name"~"pestic|fertil|krishi|agri|seed|rythu|raithu|agro|nursery",i](around:${radius},${lat},${lon});
);
out center 80;`;
    const endpoints = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
    ];
    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: q,
        });
        if (!res.ok) continue;
        const json = (await res.json()) as {
          elements: Array<{
            id: number;
            lat?: number;
            lon?: number;
            center?: { lat: number; lon: number };
            tags?: Record<string, string>;
          }>;
        };
        const list: Shop[] = (json.elements ?? [])
          .map((e) => {
            const elat = e.lat ?? e.center?.lat;
            const elon = e.lon ?? e.center?.lon;
            if (elat == null || elon == null) return null;
            const name = e.tags?.name ?? e.tags?.["name:en"] ?? "Agri shop";
            return {
              id: String(e.id),
              name,
              lat: elat,
              lon: elon,
              distanceKm: haversine(lat, lon, elat, elon),
              address: [
                e.tags?.["addr:street"],
                e.tags?.["addr:city"] ?? e.tags?.["addr:village"] ?? e.tags?.["addr:town"],
              ]
                .filter(Boolean)
                .join(", "),
            } as Shop;
          })
          .filter((s): s is Shop => s !== null)
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .slice(0, 20);
        if (list.length > 0) return list;
        break; // endpoint worked but empty; expand radius
      } catch {
        // try next endpoint
      }
    }
  }
  return [];
}

async function geocodePlace(query: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const arr = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!arr.length) return null;
    return { lat: parseFloat(arr[0].lat), lon: parseFloat(arr[0].lon) };
  } catch {
    return null;
  }
}

export function PesticideShops() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [query, setQuery] = useState("");
  const [shops, setShops] = useState<Shop[] | null>(null);
  const [origin, setOrigin] = useState<{ lat: number; lon: number; label?: string } | null>(null);

  async function runSearch(lat: number, lon: number, label?: string) {
    setLoading(true);
    setShops(null);
    setOrigin({ lat, lon, label });
    try {
      const list = await fetchShopsAround(lat, lon);
      setShops(list);
      if (list.length === 0) toast.info(t("noShopsFound"));
    } catch {
      toast.error("Could not load nearby shops.");
      setShops([]);
    } finally {
      setLoading(false);
    }
  }

  async function searchByText(e?: React.FormEvent) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) {
      toast.error("Enter a village or city name");
      return;
    }
    setLoading(true);
    const geo = await geocodePlace(q);
    if (!geo) {
      setLoading(false);
      toast.error("Location not found. Try a nearby town name.");
      return;
    }
    await runSearch(geo.lat, geo.lon, q);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast.error(t("geoUnsupported"));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocating(false);
        await runSearch(pos.coords.latitude, pos.coords.longitude, t("useMyLocation"));
      },
      () => {
        setLocating(false);
        toast.error(t("geoDenied"));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <Store className="h-5 w-5 text-primary" /> {t("shopsNearby")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={searchByText} className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("villagePlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              maxLength={100}
            />
          </div>
          <VoiceInput onTranscript={(txt) => setQuery(txt.trim())} title={t("speakToType")} />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={useMyLocation}
            disabled={locating || loading}
            title={t("useMyLocation")}
            aria-label={t("useMyLocation")}
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>

        {origin?.label && !loading && (
          <p className="text-xs text-muted-foreground">
            {t("fieldLocation")}: <span className="text-foreground font-medium">{origin.label}</span>
          </p>
        )}

        {loading && <p className="text-sm text-muted-foreground">{t("loadingShops")}</p>}
        {!loading && shops && shops.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("noShopsFound")}</p>
        )}
        {shops && shops.length > 0 && (
          <ul className="grid md:grid-cols-2 gap-2">
            {shops.map((s) => (
              <li
                key={s.id}
                className="flex items-start gap-2 rounded-lg border border-border/60 bg-background/60 p-3"
              >
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-foreground truncate">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.distanceKm.toFixed(1)} km{s.address ? ` · ${s.address}` : ""}
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lon}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary underline inline-flex items-center gap-1 shrink-0"
                >
                  {t("openInMaps")} <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
