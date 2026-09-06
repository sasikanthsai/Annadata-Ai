import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sun, Moon, Monitor, Palette, Globe, Ruler, Bell, MapPin, ShieldAlert, Download, Plus, Trash2, Star, KeyRound, LogOut } from "lucide-react";
import { useTheme, ACCENTS, type Accent, type Theme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { getMySettings, updateMySettings } from "@/lib/settings.functions";
import { createFarm, deleteFarm, listFarms, updateFarm } from "@/lib/farms.functions";
import { deleteMyAccount, exportMyDataCsv } from "@/lib/account.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Annadata AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useI18n();
  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold">{t("settings")}</h1>
        <p className="text-sm text-muted-foreground mt-1">Personalize Annadata AI to your farm and language.</p>
      </header>
      <AppearanceCard />
      <LocaleCard />
      <NotificationsCard />
      <FarmsCard />
      <AccountCard />
    </div>
  );
}

function SectionCard({ icon: Icon, title, description, children }: { icon: typeof Sun; title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="border-border/60 shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function AppearanceCard() {
  const { theme, setTheme, accent, setAccent } = useTheme();
  const { t } = useI18n();
  const updateFn = useServerFn(updateMySettings);
  const sync = (patch: Record<string, string>) => { updateFn({ data: patch }).catch(() => {}); };

  return (
    <SectionCard icon={Palette} title={t("appearance")} description="Light/dark mode and accent color.">
      <div className="space-y-2">
        <Label>Theme</Label>
        <div className="flex gap-2 flex-wrap">
          {([
            { v: "light", label: "Light", icon: Sun },
            { v: "dark", label: "Dark", icon: Moon },
            { v: "system", label: "System", icon: Monitor },
          ] as const).map(({ v, label, icon: I }) => (
            <Button key={v} variant={theme === v ? "default" : "outline"} onClick={() => { setTheme(v as Theme); sync({ theme: v }); }} className="gap-2"><I className="h-4 w-4" /> {label}</Button>
          ))}
        </div>
      </div>
      <Separator />
      <div className="space-y-2">
        <Label>Accent color</Label>
        <div className="flex gap-3 flex-wrap">
          {ACCENTS.map((a) => (
            <button key={a.id} onClick={() => { setAccent(a.id); sync({ accent: a.id }); }} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-smooth ${accent === a.id ? "border-primary ring-2 ring-primary/30" : "border-border hover:bg-muted"}`}>
              <span className="h-5 w-5 rounded-full" style={{ background: a.swatch }} />
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function LocaleCard() {
  const { t } = useI18n();
  const updateFn = useServerFn(updateMySettings);
  const getFn = useServerFn(getMySettings);
  const q = useQuery({ queryKey: ["settings"], queryFn: () => getFn() });
  const tempUnit = q.data?.temperature_unit ?? "C";
  const rainUnit = q.data?.rainfall_unit ?? "mm";
  const qc = useQueryClient();
  const update = (patch: Record<string, string>) => updateFn({ data: patch }).then(() => qc.invalidateQueries({ queryKey: ["settings"] }));

  return (
    <SectionCard icon={Globe} title={t("units")}>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label className="flex items-center gap-1"><Ruler className="h-3 w-3" /> Temperature</Label>
          <Select value={tempUnit} onValueChange={(v) => update({ temperature_unit: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="C">°C Celsius</SelectItem><SelectItem value="F">°F Fahrenheit</SelectItem></SelectContent>
          </Select>
        </div>
        <div>
          <Label>Rainfall</Label>
          <Select value={rainUnit} onValueChange={(v) => update({ rainfall_unit: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="mm">mm</SelectItem><SelectItem value="in">inches</SelectItem></SelectContent>
          </Select>
        </div>
      </div>
    </SectionCard>
  );
}

function NotificationsCard() {
  const { t } = useI18n();
  const getFn = useServerFn(getMySettings);
  const updateFn = useServerFn(updateMySettings);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["settings"], queryFn: () => getFn() });
  const set = (k: string, v: boolean) => updateFn({ data: { [k]: v } }).then(() => qc.invalidateQueries({ queryKey: ["settings"] }));
  const s = q.data;

  return (
    <SectionCard icon={Bell} title={t("notifications")}>
      {[
        { k: "notify_weather", label: "Severe weather alerts", desc: "Heatwave, frost, heavy rain warnings." },
        { k: "notify_reminders", label: "Task reminders", desc: "Show calendar tasks due today on the dashboard." },
        { k: "notify_email_digest", label: "Weekly email digest", desc: "Get a Monday summary of scans and weather." },
      ].map((r) => (
        <div key={r.k} className="flex items-center justify-between gap-3">
          <div><div className="font-medium">{r.label}</div><div className="text-xs text-muted-foreground">{r.desc}</div></div>
          <Switch checked={Boolean(s?.[r.k as keyof typeof s])} onCheckedChange={(v) => set(r.k, v)} />
        </div>
      ))}
    </SectionCard>
  );
}

function FarmsCard() {
  const list = useServerFn(listFarms);
  const create = useServerFn(createFarm);
  const update = useServerFn(updateFarm);
  const del = useServerFn(deleteFarm);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["farms"], queryFn: () => list() });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(""); const [village, setVillage] = useState(""); const [crop, setCrop] = useState("");

  const addM = useMutation({
    mutationFn: () => create({ data: { name, village, crop: crop || null, is_default: (q.data ?? []).length === 0 } }),
    onSuccess: () => { toast.success("Farm added"); qc.invalidateQueries({ queryKey: ["farms"] }); setOpen(false); setName(""); setVillage(""); setCrop(""); },
    onError: (e: Error) => toast.error(e.message),
  });
  const makeDefault = useMutation({
    mutationFn: (id: string) => update({ data: { id, is_default: true } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["farms"] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["farms"] }),
  });

  return (
    <SectionCard icon={MapPin} title="My farms" description="Save multiple villages or fields to switch quickly.">
      <div className="space-y-2">
        {(q.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">No farms yet. Add your first below.</p>}
        {(q.data ?? []).map((f) => (
          <div key={f.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
            <div className="min-w-0">
              <div className="font-medium flex items-center gap-2">{f.name} {f.is_default && <Badge className="gap-1"><Star className="h-3 w-3" /> Default</Badge>}</div>
              <div className="text-xs text-muted-foreground">{f.village}{f.crop ? ` · ${f.crop}` : ""}</div>
            </div>
            <div className="flex gap-1">
              {!f.is_default && <Button size="sm" variant="ghost" onClick={() => makeDefault.mutate(f.id)}><Star className="h-4 w-4" /></Button>}
              <Button size="icon" variant="ghost" onClick={() => remove.mutate(f.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><Button variant="secondary"><Plus className="mr-2 h-4 w-4" /> Add farm</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Add farm</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. North field" /></div>
            <div><Label>Village / city</Label><Input value={village} onChange={(e) => setVillage(e.target.value)} /></div>
            <div><Label>Main crop (optional)</Label><Input value={crop} onChange={(e) => setCrop(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={() => addM.mutate()} disabled={!name.trim() || !village.trim() || addM.isPending}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}

function AccountCard() {
  const navigate = useNavigate();
  const exportFn = useServerFn(exportMyDataCsv);
  const delFn = useServerFn(deleteMyAccount);
  const [pw, setPw] = useState("");

  async function downloadCsv() {
    try {
      const r = await exportFn();
      const blob = new Blob([r.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = r.filename; a.click(); URL.revokeObjectURL(url);
    } catch (e) { toast.error((e as Error).message); }
  }
  async function changePassword() {
    if (pw.length < 8) return toast.error("Password must be at least 8 characters.");
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) toast.error(error.message); else { toast.success("Password updated"); setPw(""); }
  }
  async function destroy() {
    try { await delFn(); await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); }
    catch (e) { toast.error((e as Error).message); }
  }

  return (
    <SectionCard icon={ShieldAlert} title="Account, security & data">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={downloadCsv}><Download className="mr-2 h-4 w-4" /> Export history (CSV)</Button>
        <Button variant="outline" onClick={() => supabase.auth.signOut().then(() => navigate({ to: "/auth" }))}><LogOut className="mr-2 h-4 w-4" /> Sign out everywhere</Button>
      </div>
      <Separator />
      <div className="space-y-2">
        <Label className="flex items-center gap-1"><KeyRound className="h-3 w-3" /> Change password</Label>
        <div className="flex gap-2"><Input type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} /><Button onClick={changePassword}>Update</Button></div>
      </div>
      <Separator />
      <AlertDialog>
        <AlertDialogTrigger asChild><Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete account</Button></AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes your profile, farms, reminders and prediction history. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={destroy} className="bg-destructive text-destructive-foreground">Delete forever</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  );
}
