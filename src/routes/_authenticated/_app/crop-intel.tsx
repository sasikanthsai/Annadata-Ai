import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sprout,
  CloudRain,
  AlertTriangle,
  ShieldAlert,
  Lightbulb,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Loader2,
  CloudSun,
  Wind,
  Droplets,
} from "lucide-react";
import { toast } from "sonner";
import { getCropIntel, type CropIntelResult } from "@/lib/cropIntel.functions";
import { getMyProfile } from "@/lib/profile.functions";
import { useI18n, type Lang } from "@/lib/i18n";
import { logActivity } from "@/lib/activity.functions";
import { getCurrentActivityUserId, getOrCreateActivitySessionId } from "@/lib/activity-client";

export const Route = createFileRoute("/_authenticated/_app/crop-intel")({
  ssr: false,
  head: () => ({ meta: [{ title: "Crop Weather Intelligence · Annadata AI" }] }),
  component: CropIntelPage,
});

const LOCALE: Record<Lang, string> = { en: "en-IN", hi: "hi-IN", mr: "mr-IN", ta: "ta-IN", te: "te-IN" };

const STAGE_OPTIONS = [
  "Sowing",
  "Germination",
  "Seedling",
  "Vegetative",
  "Tillering",
  "Flowering",
  "Fruiting / Grain filling",
  "Maturity",
  "Harvest",
];

const STAGE_LABELS: Record<Lang, Record<string, string>> = {
  en: {
    Sowing: "Sowing", Germination: "Germination", Seedling: "Seedling", Vegetative: "Vegetative",
    Tillering: "Tillering", Flowering: "Flowering", "Fruiting / Grain filling": "Fruiting / Grain filling",
    Maturity: "Maturity", Harvest: "Harvest",
  },
  hi: {
    Sowing: "बुवाई", Germination: "अंकुरण", Seedling: "पौध", Vegetative: "वानस्पतिक",
    Tillering: "कल्ले फूटना", Flowering: "फूल आना", "Fruiting / Grain filling": "फल / दाना भरना",
    Maturity: "परिपक्वता", Harvest: "कटाई",
  },
  mr: {
    Sowing: "पेरणी", Germination: "उगवण", Seedling: "रोपटे", Vegetative: "वाढीचा टप्पा",
    Tillering: "फुटवे येणे", Flowering: "फुलोरा", "Fruiting / Grain filling": "फळधारणा / दाणे भरणे",
    Maturity: "पक्वता", Harvest: "कापणी",
  },
  ta: {
    Sowing: "விதைப்பு", Germination: "முளைப்பு", Seedling: "நாற்று", Vegetative: "வளர்ச்சி நிலை",
    Tillering: "தூர்வை", Flowering: "பூக்கும் நிலை", "Fruiting / Grain filling": "காய்ப்பு / தானியம் நிரப்புதல்",
    Maturity: "முதிர்வு", Harvest: "அறுவடை",
  },
  te: {
    Sowing: "విత్తనం వేయడం", Germination: "మొలకెత్తడం", Seedling: "మొక్క దశ", Vegetative: "ఎదుగుదల దశ",
    Tillering: "పిలకలు రావడం", Flowering: "పుష్పించే దశ", "Fruiting / Grain filling": "కాయ / గింజ నిండే దశ",
    Maturity: "పక్వత", Harvest: "కోత",
  },
};


function CropIntelPage() {
  const { lang } = useI18n();
  const fetchProfile = useServerFn(getMyProfile);
  const profileQ = useQuery({ queryKey: ["me"], queryFn: () => fetchProfile() });
  const log = useServerFn(logActivity);

  const [crop, setCrop] = useState("");
  const [stage, setStage] = useState("Vegetative");
  const [location, setLocation] = useState("");
  const [activeMic, setActiveMic] = useState<null | "crop" | "location">(null);
  const [speaking, setSpeaking] = useState(false);
  const recRef = useRef<unknown>(null);

  useEffect(() => {
    if (!location && profileQ.data?.village) setLocation(profileQ.data.village);
  }, [profileQ.data, location]);

  const call = useServerFn(getCropIntel);
  const mut = useMutation<CropIntelResult, Error, void>({
    mutationFn: () => call({ data: { crop, stage, location, language: lang } }),
    onSuccess: (r) => {
      getCurrentActivityUserId().then((userId) =>
        log({
          data: {
            event_type: "weather_lookup",
            path: window.location.pathname,
            query: `${crop} · ${stage} · ${location}`,
            session_id: getOrCreateActivitySessionId(),
            user_id: userId,
            metadata: { crop: r.crop, stage: r.stage } as never,
          },
        }),
      ).catch(() => {});
    },
    onError: (e) => toast.error(e.message),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!crop.trim() || !location.trim()) {
      toast.error("Enter crop name and location");
      return;
    }
    mut.mutate();
  }

  function toggleMic(target: "crop" | "location") {
    const SR = (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice input not supported in this browser."); return; }
    if (activeMic === target) {
      (recRef.current as { stop: () => void } | null)?.stop();
      setActiveMic(null);
      return;
    }
    const rec = new (SR as new () => {
      lang: string; interimResults: boolean; continuous: boolean;
      onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
      onend: () => void; onerror: () => void; start: () => void; stop: () => void;
    })();
    rec.lang = LOCALE[lang];
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      const text = Array.from(e.results).map((r) => r[0].transcript).join(" ").trim();
      if (target === "crop") setCrop(text);
      else setLocation(text);
    };
    rec.onend = () => setActiveMic(null);
    rec.onerror = () => setActiveMic(null);
    rec.start();
    recRef.current = rec;
    setActiveMic(target);
  }

  function speak(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast.error("Voice output not supported in this browser.");
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LOCALE[lang];
    u.rate = 0.95;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  }

  const r = mut.data;

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Sprout className="h-6 w-6" /></span>
          Crop Weather Intelligence
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Enter your crop and its growth stage. Annadata AI checks the 7-day forecast and tells you what to do — in your language, with voice support.
        </p>
      </header>

      <Card>
        <CardContent className="p-5">
          <form onSubmit={onSubmit} className="grid md:grid-cols-4 gap-3 items-end">
            <div className="space-y-1.5 md:col-span-1">
              <Label htmlFor="crop">Crop</Label>
              <div className="flex gap-2">
                <Input id="crop" placeholder="e.g. Rice, Tomato, Cotton" value={crop} onChange={(e) => setCrop(e.target.value)} />
                <Button type="button" variant={activeMic === "crop" ? "destructive" : "secondary"} size="icon" onClick={() => toggleMic("crop")} title="Speak the crop name">
                  {activeMic === "crop" ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stage">Growth stage</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger id="stage"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{STAGE_LABELS[lang]?.[s] ?? s}</SelectItem>)}
                </SelectContent>
              </Select>

            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loc">Location / village</Label>
              <div className="flex gap-2">
                <Input id="loc" placeholder="e.g. Guntur" value={location} onChange={(e) => setLocation(e.target.value)} />
                <Button type="button" variant={activeMic === "location" ? "destructive" : "secondary"} size="icon" onClick={() => toggleMic("location")} title="Speak the location">
                  {activeMic === "location" ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" disabled={mut.isPending} className="h-10">
              {mut.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analysing…</> : <>Get advice</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {r && (
        <div className="space-y-6">
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2"><CloudSun className="h-5 w-5 text-primary" /> {r.crop} · {r.stage}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{r.location}, {r.country}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => speak(r.voiceScript || r.summary)}>
                {speaking ? <><VolumeX className="h-4 w-4 mr-2" /> Stop</> : <><Volume2 className="h-4 w-4 mr-2" /> Listen</>}
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground">{r.summary}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>7-day forecast</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {r.days.map((d) => (
                  <div key={d.date} className="rounded-xl border bg-card p-3 text-center space-y-1">
                    <div className="text-xs font-semibold text-muted-foreground">{d.weekday}</div>
                    <img src={`https://openweathermap.org/img/wn/${d.icon}@2x.png`} alt={d.description} className="mx-auto h-12 w-12" />
                    <div className="text-sm font-bold text-foreground">{d.tempMax}° / {d.tempMin}°</div>
                    <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground"><CloudRain className="h-3 w-3" /> {d.rainChance}%</div>
                    <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground"><Droplets className="h-3 w-3" /> {d.humidity}%</div>
                    <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground"><Wind className="h-3 w-3" /> {d.windSpeed} km/h</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <ListCard icon={<CloudRain className="h-5 w-5" />} title="Rain alerts" items={r.rainAlerts} tone="info" emptyHint="No rain alerts in the next 7 days." />
            <ListCard icon={<Sprout className="h-5 w-5" />} title="Sowing & harvesting" items={r.sowingHarvest} tone="primary" />
            <ListCard icon={<AlertTriangle className="h-5 w-5" />} title="Emergency actions (next 48h)" items={r.emergencyActions} tone="danger" />
            <ListCard icon={<ShieldAlert className="h-5 w-5" />} title="Dangers to watch" items={r.dangers} tone="warning" />
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary" /> Best practices</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                  {r.bestPractices.map((b, i) => (
                    <li key={i} className="flex gap-2"><Badge variant="secondary" className="h-5 shrink-0">{i + 1}</Badge><span className="text-foreground">{b}</span></li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function ListCard({ icon, title, items, tone, emptyHint }: { icon: React.ReactNode; title: string; items: string[]; tone: "info" | "primary" | "danger" | "warning"; emptyHint?: string }) {
  const toneClass =
    tone === "danger" ? "border-destructive/40 bg-destructive/5"
      : tone === "warning" ? "border-warning/40 bg-warning/5"
        : tone === "primary" ? "border-primary/30 bg-primary/5"
          : "";
  return (
    <Card className={toneClass}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">{icon} {title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyHint ?? "Nothing critical here."}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {items.map((it, i) => (
              <li key={i} className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" /><span className="text-foreground">{it}</span></li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
