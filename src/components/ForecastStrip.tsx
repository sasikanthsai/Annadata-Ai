import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CloudRain, Droplets, Wind, AlertTriangle, Info, ShieldAlert, CalendarDays } from "lucide-react";
import { getForecast } from "@/lib/forecast.functions";
import { useI18n } from "@/lib/i18n";

export function ForecastStrip({ location }: { location: string }) {
  const fn = useServerFn(getForecast);
  const { t } = useI18n();
  const q = useQuery({
    queryKey: ["forecast", location],
    queryFn: () => fn({ data: { location } }),
    enabled: !!location,
    staleTime: 1000 * 60 * 15,
    retry: false,
  });

  if (!location) return null;

  return (
    <Card className="border-border/60 shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <CalendarDays className="h-5 w-5 text-primary" /> {t("forecast")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {q.isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
          </div>
        )}
        {q.isError && <p className="text-sm text-destructive">{(q.error as Error).message}</p>}
        {q.data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {q.data.days.map((d) => (
                <div key={d.date} className="rounded-lg border border-border/60 bg-gradient-card p-3 text-center transition-smooth hover:shadow-soft hover:-translate-y-0.5">
                  <div className="text-xs font-medium text-muted-foreground">{d.weekday}</div>
                  <img src={`https://openweathermap.org/img/wn/${d.icon}@2x.png`} alt={d.description} className="mx-auto h-12 w-12" />
                  <div className="font-display text-base font-bold">{d.tempMax}° <span className="text-muted-foreground font-normal">/ {d.tempMin}°</span></div>
                  <div className="mt-1 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                    <CloudRain className="h-3 w-3" /> {d.rainChance}%
                  </div>
                  <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Droplets className="h-3 w-3" />{d.humidity}%</span>
                    <span className="flex items-center gap-0.5"><Wind className="h-3 w-3" />{d.windSpeed}</span>
                  </div>
                </div>
              ))}
            </div>
            {q.data.alerts.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-foreground">{t("alerts")}</div>
                {q.data.alerts.map((a, i) => (
                  <Alert key={i} variant={a.level === "danger" ? "destructive" : "default"} className={a.level === "warning" ? "border-warning/40 bg-warning/5" : ""}>
                    {a.level === "danger" ? <ShieldAlert className="h-4 w-4" /> : a.level === "warning" ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                    <AlertTitle>{a.title}</AlertTitle>
                    <AlertDescription>{a.message}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
