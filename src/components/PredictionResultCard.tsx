import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle2, Leaf, ShieldCheck, Sprout, FlaskConical, Stethoscope, TrendingUp, CalendarDays, Volume2, VolumeX, ArrowRight, Activity, HeartPulse, IndianRupee, Recycle, Bug, SprayCan, ShoppingCart } from "lucide-react";
import { fertilizerImage } from "@/lib/fertilizer-images";
import { useI18n, type Lang } from "@/lib/i18n";
import { translatePredictionResult, type PredictionResult } from "@/lib/predictions.functions";
import { PesticideShops } from "@/components/PesticideShops";

const LOCALE: Record<Lang, string> = { en: "en-IN", hi: "hi-IN", mr: "mr-IN", ta: "ta-IN", te: "te-IN" };

function useSpeak() {
  const { lang } = useI18n();
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  function speak(id: string, text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (speakingId === id) { window.speechSynthesis.cancel(); setSpeakingId(null); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LOCALE[lang]; u.rate = 0.95;
    u.onend = () => setSpeakingId(null);
    window.speechSynthesis.speak(u);
    setSpeakingId(id);
  }
  return { speakingId, speak };
}


export function PredictionResultCard({ result }: { result: PredictionResult }) {
  const { speakingId, speak } = useSpeak();
  const { t, lang } = useI18n();
  const translate = useServerFn(translatePredictionResult);
  const [displayResult, setDisplayResult] = useState(result);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDisplayResult(result);
    if ((result.language ?? "en") === lang) {
      setTranslating(false);
      return;
    }

    setTranslating(true);
    translate({ data: { language: lang, result } })
      .then((translated) => {
        if (!cancelled) setDisplayResult(translated);
      })
      .catch(() => {
        if (!cancelled) setDisplayResult(result);
      })
      .finally(() => {
        if (!cancelled) setTranslating(false);
      });

    return () => { cancelled = true; };
  }, [lang, result]);

  const shown = displayResult;
  const sevColor =
    shown.recommendation?.severity === "high"
      ? "bg-destructive text-destructive-foreground"
      : shown.recommendation?.severity === "medium"
      ? "bg-warning text-warning-foreground"
      : "bg-success text-success-foreground";

  const progress = shown.progress_prediction;
  const plan = shown.treatment_plan;
  const sev = shown.severity_analysis;
  const health = shown.health_score;
  const econ = shown.economic_impact;
  const organic = shown.organic_alternatives ?? [];
  const pest = shown.pest_info;
  const dosage = shown.pesticide_dosage;


  const heroSpoken = `${shown.crop || t("crop")}. ${shown.disease_name}. ${shown.notes ?? ""}. ${sev ? sev.summary : ""} ${health ? health.summary : ""} ${progress ? progress.summary : ""} ${plan ? plan.summary : ""}`;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <Card className="overflow-hidden border-border/60 shadow-elegant">
        <div className="grid md:grid-cols-[260px_1fr]">
          {shown.image_url && (
            <img src={shown.image_url} alt="Scanned crop" className="h-48 md:h-full w-full object-cover" />
          )}
          <CardContent className="p-6 space-y-3">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{shown.crop || t("crop")}</p>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                  {shown.is_healthy ? <CheckCircle2 className="h-6 w-6 text-success" /> : <AlertTriangle className="h-6 w-6 text-warning" />}
                  {shown.disease_name}
                </h2>
              </div>
              <div className="text-right">
                <div className="font-display text-3xl font-bold text-primary">{Math.round(shown.confidence)}%</div>
                <div className="text-xs text-muted-foreground">{t("confidence")}</div>
              </div>
            </div>
            {translating && <p className="text-xs font-medium text-primary">{t("translatingAnalysis")}</p>}
            {shown.notes && <p className="text-sm text-muted-foreground">{shown.notes}</p>}
            <div className="flex flex-wrap gap-2 pt-1 items-center">
              {shown.recommendation && (
                <>
                  <Badge className={sevColor}>{t("severity")}: {t(shown.recommendation.severity)}</Badge>
                  {shown.recommendation.scientific_name && (
                    <Badge variant="outline" className="italic">{shown.recommendation.scientific_name}</Badge>
                  )}
                </>
              )}
              <Button size="sm" variant="outline" onClick={() => speak("hero", heroSpoken)} className="ml-auto">
                {speakingId === "hero" ? <><VolumeX className="h-4 w-4 mr-1" /> {t("stop")}</> : <><Volume2 className="h-4 w-4 mr-1" /> {t("listen")}</>}
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>

      {(sev || health) && (
        <div className="grid md:grid-cols-2 gap-4">
          {sev && (
            <Card className="border-warning/40 bg-warning/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <Activity className="h-5 w-5 text-warning" /> {t("diseaseSeverity")}
                  <Badge className={
                    sev.level === "severe" ? "bg-destructive text-destructive-foreground ml-2" :
                    sev.level === "medium" ? "bg-warning text-warning-foreground ml-2" :
                    "bg-success text-success-foreground ml-2"
                  }>{sev.level === "mild" ? t("mild") : sev.level === "medium" ? t("medium") : t("severe")}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{t("infectionPercent")}</span>
                    <span className="font-display text-2xl font-bold text-warning">{Math.round(sev.infection_percent)}%</span>
                  </div>
                  <Progress value={Math.min(100, sev.infection_percent)} className="h-2" />
                </div>
                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{t("affectedArea")}</span>
                    <span className="font-semibold text-foreground">{Math.round(sev.affected_leaf_area_percent)}%</span>
                  </div>
                  <Progress value={Math.min(100, sev.affected_leaf_area_percent)} className="h-2" />
                </div>
                <div className="rounded-lg bg-background/70 border border-border/60 p-3">
                  <div className="text-xs text-muted-foreground">{t("recoveryChance")}</div>
                  <div className="font-display text-xl font-bold text-success">{Math.round(sev.recovery_probability_percent)}%</div>
                  <div className="text-xs text-foreground/80 mt-0.5">
                    {t("recoveryWindow")} {sev.recovery_window_hours} {t("hours")}
                  </div>
                </div>
                <p className="text-sm text-foreground/90">{sev.summary}</p>
              </CardContent>
            </Card>
          )}

          {health && (
            <Card className="border-primary/40 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <HeartPulse className="h-5 w-5 text-primary" /> {t("cropHealthScore")}
                  <Badge variant="outline" className="ml-2 capitalize">{t(health.grade as any)}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end gap-3">
                  <div className="font-display text-5xl font-bold text-primary leading-none">{Math.round(health.score)}</div>
                  <div className="text-sm text-muted-foreground pb-1">/ 100</div>
                </div>
                <Progress value={Math.min(100, health.score)} className="h-2" />
                <p className="text-sm text-foreground/90">{health.summary}</p>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t("healthFactors")}</div>
                  <ul className="space-y-2">
                    {health.factors.map((f, i) => (
                      <li key={i} className="rounded-lg bg-background/70 border border-border/60 p-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">{f.name}</span>
                          <span className="font-semibold text-primary">{Math.round(f.score)}/100</span>
                        </div>
                        <Progress value={Math.min(100, f.score)} className="h-1.5 mt-1" />
                        {f.note && <div className="text-xs text-muted-foreground mt-1">{f.note}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {econ && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <IndianRupee className="h-5 w-5 text-primary" /> {t("economicImpact")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border/60 bg-background/60 p-3">
              <div className="text-xs text-muted-foreground">{t("yieldLoss")}</div>
              <div className="font-display text-2xl font-bold text-destructive">{Math.round(econ.yield_loss_percent)}%</div>
              <div className="text-xs text-foreground/80 mt-1">{econ.estimated_loss_note}</div>
            </div>
            <div className="md:col-span-2 rounded-lg border border-border/60 bg-background/60 p-3">
              <div className="text-xs text-muted-foreground">{t("treatmentCost")}</div>
              <div className="text-sm text-foreground mt-1">{econ.treatment_cost_note}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {organic.length > 0 && (
        <Card className="border-success/40 bg-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Recycle className="h-5 w-5 text-success" /> {t("organicOptions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid md:grid-cols-2 gap-2 text-sm">
              {organic.map((o, i) => (
                <li key={i} className="flex gap-2 rounded-lg border border-border/60 bg-background/60 p-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 bg-success" />
                  <span className="text-foreground">{o}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {pest && (
        <Card className="border-warning/40 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Bug className="h-5 w-5 text-warning" /> {t("pestInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-border/60 bg-background/60 p-3">
              <div className="text-xs text-muted-foreground">{t("pestCategory")}</div>
              <div className="font-semibold text-foreground">{pest.category}</div>
              {pest.scientific_name && <div className="text-xs italic text-muted-foreground mt-1">{pest.scientific_name}</div>}
            </div>
            <div className="rounded-lg border border-border/60 bg-background/60 p-3">
              <div className="text-xs text-muted-foreground">{t("damageType")}</div>
              <div className="text-foreground">{pest.damage_type}</div>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/60 p-3 md:col-span-2">
              <div className="text-xs text-muted-foreground">{t("lifeCycle")}</div>
              <div className="text-foreground">{pest.life_cycle}</div>
            </div>
            {pest.host_crops?.length > 0 && (
              <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                <div className="text-xs text-muted-foreground mb-1">{t("hostCrops")}</div>
                <div className="flex flex-wrap gap-1">
                  {pest.host_crops.map((c, i) => <Badge key={i} variant="outline">{c}</Badge>)}
                </div>
              </div>
            )}
            {pest.natural_enemies?.length > 0 && (
              <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                <div className="text-xs text-muted-foreground mb-1">{t("naturalEnemies")}</div>
                <div className="flex flex-wrap gap-1">
                  {pest.natural_enemies.map((c, i) => <Badge key={i} className="bg-success/15 text-success border-success/30" variant="outline">{c}</Badge>)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {dosage && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <SprayCan className="h-5 w-5 text-primary" /> {t("pesticideDosage")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border border-primary/30 bg-background/70 p-3">
              <div className="text-xs text-muted-foreground">{t("chemicalProduct")}</div>
              <div className="font-display text-lg font-bold text-foreground">{dosage.chemical_product}</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                <div className="text-xs text-muted-foreground">{t("dosagePerAcre")}</div>
                <div className="font-display text-xl font-bold text-primary">{dosage.dosage_per_acre} {dosage.dosage_unit}</div>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                <div className="text-xs text-muted-foreground">{t("waterPerAcre")}</div>
                <div className="font-display text-xl font-bold text-foreground">{dosage.water_per_acre_liters} L</div>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                <div className="text-xs text-muted-foreground">{t("sprayFrequency")}</div>
                <div className="font-display text-xl font-bold text-foreground">{dosage.spray_frequency_days} {t("days")}</div>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                <div className="text-xs text-muted-foreground">{t("reapplications")}</div>
                <div className="font-display text-xl font-bold text-foreground">{dosage.reapplications}×</div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              <div className="rounded-lg border border-warning/40 bg-warning/10 p-3">
                <div className="text-xs font-semibold text-warning uppercase mb-1">{t("preHarvestInterval")}</div>
                <div className="text-foreground">{dosage.pre_harvest_interval_days} {t("days")}</div>
              </div>
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                <div className="text-xs font-semibold text-destructive uppercase mb-1">{t("safetyNotes")}</div>
                <div className="text-foreground">{dosage.safety_notes}</div>
              </div>
            </div>
            {dosage.organic_alternative && (
              <div className="rounded-lg border border-success/40 bg-success/10 p-3">
                <div className="text-xs font-semibold text-success uppercase mb-1">{t("organicAlternative")}</div>
                <div className="text-foreground">{dosage.organic_alternative}</div>
              </div>
            )}
            {dosage.step_by_step?.length > 0 && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t("howToApply")}</div>
                <ol className="space-y-1.5">
                  {dosage.step_by_step.map((s, i) => (
                    <li key={i} className="flex gap-2 rounded-lg border border-border/60 bg-background/60 p-2">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{i + 1}</span>
                      <span className="text-foreground">{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {(dosage || pest) && <PesticideShops />}




      {progress && (
        <Card className="border-warning/40 bg-warning/5 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <TrendingUp className="h-5 w-5 text-warning" /> {t("diseaseProgressPrediction")}
              <Badge variant="outline" className="ml-2 capitalize">{t(progress.risk_level)} {t("risk")}</Badge>
              <Button size="sm" variant="ghost" className="ml-auto" onClick={() => speak("prog", progress.summary + ". " + progress.timeline.map(p => `${t("day")} ${p.day}: ${p.spread_percent}% — ${p.stage}.`).join(" "))}>
                {speakingId === "prog" ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-foreground font-medium">{progress.summary}</p>
            <div className="rounded-lg bg-background/60 p-4 border border-border/60">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs text-muted-foreground">{t("estimatedSpread5Days")}</span>
                <span className="font-display text-2xl font-bold text-warning">{Math.round(progress.five_day_spread_percent)}%</span>
              </div>
              <Progress value={Math.min(100, progress.five_day_spread_percent)} className="h-2" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {progress.timeline.map((p) => (
                <div key={p.day} className="rounded-lg border border-border/60 bg-background/60 p-3">
                  <div className="text-xs text-muted-foreground">{t("day")} {p.day}</div>
                  <div className="font-display text-xl font-bold text-foreground">{Math.round(p.spread_percent)}%</div>
                  <div className="text-xs text-foreground/80 mt-1">{p.stage}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {plan && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <CalendarDays className="h-5 w-5 text-primary" /> {t("aiTreatmentPlanner")}
              <Badge variant="outline" className="ml-2">~{plan.expected_recovery_days} {t("daysRecovery")}</Badge>
              <Button size="sm" variant="ghost" className="ml-auto" onClick={() => speak("plan", plan.summary + ". " + plan.steps.map(s => `${t("day")} ${s.day}: ${s.action}. ${s.product ? s.product + ". " : ""}${s.dosage ? s.dosage + ". " : ""}${s.note ?? ""}`).join(" "))}>
                {speakingId === "plan" ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-foreground">{plan.summary}</p>
            <ol className="space-y-2">
              {plan.steps.map((s, i) => (
                <li key={i} className="flex gap-3 items-start rounded-lg border border-border/60 bg-background/60 p-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground font-display text-sm font-bold">
                    D{s.day}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-foreground">{s.action}</div>
                    {(s.product || s.dosage) && (
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {s.product}{s.product && s.dosage ? " · " : ""}{s.dosage}
                      </div>
                    )}
                    {s.note && <div className="text-xs text-foreground/70 mt-1">{s.note}</div>}
                  </div>
                  {i < plan.steps.length - 1 && <ArrowRight className="hidden md:block h-4 w-4 text-muted-foreground mt-3" />}
                </li>
              ))}
            </ol>
            <div className="pt-2">
              <Link to="/advisor"><Button variant="outline" size="sm">{t("askAdvisorMore")}</Button></Link>
            </div>
          </CardContent>
        </Card>
      )}

      {shown.recommendation ? (
        <div className="grid md:grid-cols-2 gap-4">
          <RecCard icon={Stethoscope} title={t("symptoms")} items={shown.recommendation.symptoms} tone="muted" />
          <RecCard icon={AlertTriangle} title={t("causes")} items={shown.recommendation.causes} tone="muted" />
          <RecCard icon={Sprout} title={t("treatment")} items={shown.recommendation.treatment} tone="primary" />
          <RecCard icon={ShieldCheck} title={t("prevention")} items={shown.recommendation.prevention} tone="muted" />
          {shown.recommendation.fertilizer && (
            <Card className="md:col-span-2 border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <FlaskConical className="h-5 w-5 text-primary" /> {t("recommendedFertilizer")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-foreground space-y-3">
                <div className="flex items-start gap-3">
                  <img
                    src={fertilizerImage(shown.recommendation.fertilizer)}
                    alt={shown.recommendation.fertilizer}
                    loading="lazy"
                    width={512}
                    height={512}
                    className="h-20 w-20 shrink-0 rounded-md object-cover bg-background"
                  />
                  <p>{shown.recommendation.fertilizer}</p>
                </div>
                <Link
                  to="/fertilizer-prices"
                  search={{ q: shown.recommendation.fertilizer.slice(0, 80) }}
                >
                  <Button size="sm">
                    <ShoppingCart className="mr-2 h-4 w-4" /> {t("fertilizerPrices")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      ) : shown.is_healthy ? (
        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-6 flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-success" />
            <div>
              <h3 className="font-display text-lg font-semibold">{t("looksHealthy")}</h3>
              <p className="text-sm text-muted-foreground">{t("noDiseaseDetected")}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}


function RecCard({
  icon: Icon,
  title,
  items,
  tone,
}: {
  icon: typeof Leaf;
  title: string;
  items: string[];
  tone: "primary" | "muted";
}) {
  if (!items?.length) return null;
  return (
    <Card className={tone === "primary" ? "border-primary/30 bg-primary/5" : "border-border/60"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <Icon className={`h-5 w-5 ${tone === "primary" ? "text-primary" : "text-muted-foreground"}`} /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {items.map((it, i) => (
            <li key={i} className="flex gap-2">
              <span className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${tone === "primary" ? "bg-primary" : "bg-muted-foreground"}`} />
              <span className="text-foreground">{it}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
