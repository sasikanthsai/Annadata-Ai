import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { WeatherWidget } from "@/components/WeatherWidget";
import { ImageUpload } from "@/components/ImageUpload";
import { PredictionResultCard } from "@/components/PredictionResultCard";
import { ForecastStrip } from "@/components/ForecastStrip";

import { getMyProfile } from "@/lib/profile.functions";
import { listPredictions, type PredictionResult } from "@/lib/predictions.functions";
import { listReminders } from "@/lib/reminders.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Leaf, AlertCircle, CalendarClock, Mic } from "lucide-react";
import { useI18n } from "@/lib/i18n";


export const Route = createFileRoute("/_authenticated/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Annadata AI" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { t } = useI18n();
  const [result, setResult] = useState<PredictionResult | null>(null);
  const profileFn = useServerFn(getMyProfile);
  const histFn = useServerFn(listPredictions);
  const remFn = useServerFn(listReminders);
  const profileQ = useQuery({ queryKey: ["me"], queryFn: () => profileFn() });
  const histQ = useQuery({ queryKey: ["predictions"], queryFn: () => histFn({ data: { limit: 50 } }) });
  const remQ = useQuery({ queryKey: ["reminders"], queryFn: () => remFn() });

  const village = profileQ.data?.village ?? "";
  const total = histQ.data?.length ?? 0;
  const healthy = histQ.data?.filter((p) => p.is_healthy).length ?? 0;
  const diseased = total - healthy;
  const today = new Date().toISOString().slice(0, 10);
  const dueToday = (remQ.data ?? []).filter((r) => !r.completed && r.due_date <= today).length;

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <header>
        <p className="text-sm text-muted-foreground">
          {profileQ.data?.full_name ? `${t("welcome")}, ${profileQ.data.full_name}` : t("welcome")}
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">{t("yourFarm")}</h1>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Activity} label={t("totalScans")} value={total} />
        <StatCard icon={Leaf} label={t("healthyScans")} value={healthy} tone="success" />
        <StatCard icon={AlertCircle} label={t("diseasedScans")} value={diseased} tone="warning" />
        <Link to="/calendar" className="block">
          <StatCard icon={CalendarClock} label="Due today" value={dueToday} tone="primary" />
        </Link>
      </section>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <ImageUpload onResult={setResult} />
        <WeatherWidget initialLocation={village} />
      </div>

      <ForecastStrip location={village} />

      {result && (
        <section>
          <h2 className="font-display text-2xl font-bold text-foreground mb-4">{t("latestDiagnosis")}</h2>
          <PredictionResultCard result={result} />
        </section>
      )}

      <Link to="/advisor" className="fixed bottom-6 right-6 z-40">
        <Button size="lg" className="h-14 w-14 rounded-full shadow-elegant p-0" title="Voice AI assistant">
          <Mic className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  );
}


function StatCard({ icon: Icon, label, value, tone = "default" }: { icon: typeof Activity; label: string; value: number; tone?: "default" | "success" | "warning" | "primary" }) {
  const toneCls = {
    default: "text-foreground bg-muted",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    primary: "text-primary bg-primary/10",
  }[tone];
  return (
    <Card className="border-border/60 shadow-soft transition-smooth hover:shadow-elegant hover:-translate-y-0.5">
      <CardContent className="p-4 flex items-center gap-3">
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${toneCls}`}><Icon className="h-5 w-5" /></span>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground truncate">{label}</div>
          <div className="font-display text-2xl font-bold leading-tight">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
