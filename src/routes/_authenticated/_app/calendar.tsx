import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Sprout, Droplet, FlaskConical, Bug, Wheat, ListChecks, CalendarDays } from "lucide-react";
import { createReminder, deleteReminder, listReminders, updateReminder, type ReminderKind } from "@/lib/reminders.functions";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/_app/calendar")({
  head: () => ({ meta: [{ title: "Crop Calendar — Annadata AI" }] }),
  component: CalendarPage,
});

const KIND_META: Record<ReminderKind, { label: string; icon: typeof Sprout; color: string }> = {
  sowing: { label: "Sowing", icon: Sprout, color: "text-success" },
  irrigation: { label: "Irrigation", icon: Droplet, color: "text-primary" },
  fertilizer: { label: "Fertilizer", icon: FlaskConical, color: "text-warning" },
  pesticide: { label: "Pesticide", icon: Bug, color: "text-destructive" },
  harvest: { label: "Harvest", icon: Wheat, color: "text-primary" },
  custom: { label: "Task", icon: ListChecks, color: "text-muted-foreground" },
};

function CalendarPage() {
  const qc = useQueryClient();
  const { t } = useI18n();
  const listFn = useServerFn(listReminders);
  const delFn = useServerFn(deleteReminder);
  const updFn = useServerFn(updateReminder);
  const q = useQuery({ queryKey: ["reminders"], queryFn: () => listFn() });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });
  const toggle = useMutation({
    mutationFn: (v: { id: string; completed: boolean }) => updFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const upcoming = (q.data ?? []).filter((r) => !r.completed);
  const done = (q.data ?? []).filter((r) => r.completed);

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold flex items-center gap-2"><CalendarDays className="h-7 w-7 text-primary" /> {t("calendar")}</h1>
          <p className="text-sm text-muted-foreground mt-1">Sowing, irrigation, fertilizer and harvest reminders.</p>
        </div>
        <AddReminderDialog />
      </header>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("upcoming")} <Badge variant="secondary" className="ml-2">{upcoming.length}</Badge></CardTitle></CardHeader>
        <CardContent className="divide-y">
          {q.isLoading && <p className="text-sm text-muted-foreground py-2">Loading…</p>}
          {!q.isLoading && upcoming.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No upcoming tasks. Add your first reminder above.</p>}
          {upcoming.map((r) => {
            const M = KIND_META[r.kind];
            return (
              <div key={r.id} className="flex items-center gap-3 py-3">
                <Checkbox checked={r.completed} onCheckedChange={(v) => toggle.mutate({ id: r.id, completed: !!v })} />
                <span className={`grid h-9 w-9 place-items-center rounded-lg bg-muted ${M.color}`}><M.icon className="h-4 w-4" /></span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(r.due_date).toDateString()}{r.crop ? ` · ${r.crop}` : ""}</div>
                  {r.notes && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.notes}</div>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {done.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">{t("completed")} <Badge variant="outline" className="ml-2">{done.length}</Badge></CardTitle></CardHeader>
          <CardContent className="divide-y">
            {done.map((r) => {
              const M = KIND_META[r.kind];
              return (
                <div key={r.id} className="flex items-center gap-3 py-3 opacity-60">
                  <Checkbox checked onCheckedChange={(v) => toggle.mutate({ id: r.id, completed: !!v })} />
                  <span className={`grid h-9 w-9 place-items-center rounded-lg bg-muted ${M.color}`}><M.icon className="h-4 w-4" /></span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium line-through truncate">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{new Date(r.due_date).toDateString()}</div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AddReminderDialog() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const createFn = useServerFn(createReminder);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<ReminderKind>("custom");
  const [crop, setCrop] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const m = useMutation({
    mutationFn: () => createFn({ data: { title, kind, crop: crop || null, due_date: date, notes: notes || null } }),
    onSuccess: () => {
      toast.success("Reminder added");
      qc.invalidateQueries({ queryKey: ["reminders"] });
      setOpen(false); setTitle(""); setCrop(""); setNotes("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> {t("addReminder")}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("addReminder")}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Apply urea to wheat" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as ReminderKind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(KIND_META) as ReminderKind[]).map((k) => <SelectItem key={k} value={k}>{KIND_META[k].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <div><Label>Crop (optional)</Label><Input value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="Wheat, rice…" /></div>
          <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button onClick={() => m.mutate()} disabled={!title.trim() || m.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
