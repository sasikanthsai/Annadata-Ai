import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, MessageSquareWarning, Send, Trash2 } from "lucide-react";
import { createComplaint, listMyComplaints, deleteMyComplaint } from "@/lib/complaints.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VoiceInput } from "@/components/VoiceInput";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_app/complaints")({
  head: () => ({ meta: [{ title: "Complaints — Annadata AI" }] }),
  component: ComplaintsPage,
});

function ComplaintsPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const create = useServerFn(createComplaint);
  const list = useServerFn(listMyComplaints);
  const del = useServerFn(deleteMyComplaint);
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const q = useQuery({ queryKey: ["complaints"], queryFn: () => list() });
  const m = useMutation({
    mutationFn: () => create({ data: { category, priority, title, message } }),
    onSuccess: () => {
      toast.success(t("complaintSent"));
      setTitle(""); setMessage(""); setCategory("general"); setPriority("normal");
      qc.invalidateQueries({ queryKey: ["complaints"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const d = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success(t("complaintDeleted")); qc.invalidateQueries({ queryKey: ["complaints"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const catLabel = (c: string) => ({ general: t("catGeneral"), app_issue: t("catAppIssue"), crop_diagnosis: t("catCropDiagnosis"), weather: t("catWeather"), account: t("catAccount") } as Record<string, string>)[c] ?? c;
  const prLabel = (p: string) => ({ low: t("prLow"), normal: t("prNormal"), urgent: t("prUrgent") } as Record<string, string>)[p] ?? p;
  const stLabel = (s: string) => ({ open: t("stOpen"), reviewing: t("stReviewing"), resolved: t("stResolved") } as Record<string, string>)[s] ?? s;

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">{t("complaintsSub")}</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">{t("complaintsTitle")}</h1>
      </header>

      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <MessageSquareWarning className="h-5 w-5 text-primary" /> {t("raiseComplaint")}
          </CardTitle>
          <CardDescription>{t("complaintFormDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("category")}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">{t("catGeneral")}</SelectItem>
                    <SelectItem value="app_issue">{t("catAppIssue")}</SelectItem>
                    <SelectItem value="crop_diagnosis">{t("catCropDiagnosis")}</SelectItem>
                    <SelectItem value="weather">{t("catWeather")}</SelectItem>
                    <SelectItem value="account">{t("catAccount")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("priority")}</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t("prLow")}</SelectItem>
                    <SelectItem value="normal">{t("prNormal")}</SelectItem>
                    <SelectItem value="urgent">{t("prUrgent")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("title")}</Label>
              <div className="flex gap-2">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} minLength={3} maxLength={160} required placeholder={t("shortSummary")} />
                <VoiceInput onTranscript={(txt) => setTitle((v) => (v ? v + " " : "") + txt.trim())} title={t("speakToType")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("messageLbl")}</Label>
              <div className="flex gap-2 items-start">
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} minLength={5} maxLength={2000} required rows={5} placeholder={t("explainWhatHappened")} />
                <VoiceInput onTranscript={(txt) => setMessage((v) => (v ? v + " " : "") + txt.trim())} title={t("speakToType")} />
              </div>
            </div>
            <Button type="submit" disabled={m.isPending || !title.trim() || !message.trim()}>
              {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {t("sendComplaint")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold text-foreground">{t("myComplaints")}</h2>
        {q.isLoading && <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
        {q.data?.length === 0 && (
          <Card className="border-dashed"><CardContent className="p-8 text-center text-muted-foreground">{t("noComplaints")}</CardContent></Card>
        )}
        {q.data?.map((c) => (
          <Card key={c.id} className="border-border/60">
            <CardContent className="p-5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-foreground truncate">{c.title}</h3>
                  <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge variant="outline">{catLabel(c.category)}</Badge>
                  <Badge className={c.priority === "urgent" ? "bg-destructive text-destructive-foreground" : ""}>{prLabel(c.priority)}</Badge>
                  <Badge variant={c.status === "resolved" ? "default" : "secondary"}>{stLabel(c.status)}</Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={d.isPending}
                    onClick={() => { if (confirm(t("confirmDelete"))) d.mutate(c.id); }}
                    aria-label={t("deleteBtn")}
                    title={t("deleteBtn")}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{c.message}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
