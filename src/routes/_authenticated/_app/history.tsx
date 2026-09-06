import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPredictions, deletePrediction, clearAllPredictions } from "@/lib/predictions.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Loader2, AlertTriangle, CheckCircle2, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/_app/history")({
  head: () => ({ meta: [{ title: "Prediction History — Annadata AI" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const qc = useQueryClient();
  const list = useServerFn(listPredictions);
  const del = useServerFn(deletePrediction);
  const clearAll = useServerFn(clearAllPredictions);
  const q = useQuery({ queryKey: ["predictions"], queryFn: () => list({ data: { limit: 50 } }) });

  const m = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["predictions"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const clearM = useMutation({
    mutationFn: () => clearAll({}),
    onSuccess: (r) => {
      toast.success(`Cleared ${r.deleted} scan${r.deleted === 1 ? "" : "s"}`);
      qc.invalidateQueries({ queryKey: ["predictions"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Prediction history</h1>
          <p className="text-muted-foreground mt-1">Every crop scan you've made, in one place.</p>
        </div>
        {q.data && q.data.length > 0 && (
          <Button
            variant="outline"
            className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive self-start sm:self-auto"
            disabled={clearM.isPending}
            onClick={() => { if (confirm("Delete ALL your scan history? This cannot be undone.")) clearM.mutate(); }}
          >
            {clearM.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Clear all
          </Button>
        )}
      </header>

      {q.isLoading && (
        <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      )}

      {q.data && q.data.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center">
            <ImageOff className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-display text-lg font-semibold">No scans yet</p>
            <p className="text-muted-foreground mb-4">Upload a crop photo on the dashboard to get started.</p>
            <Link to="/dashboard"><Button>Go to dashboard</Button></Link>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {q.data?.map((p) => (
          <Card key={p.id} className="overflow-hidden border-border/60 hover:shadow-elegant transition-smooth">
            <div className="flex flex-col sm:flex-row">
              {p.image_url ? (
                <img src={p.image_url} alt={p.disease_name} className="h-32 sm:h-auto sm:w-32 w-full object-cover flex-shrink-0" />
              ) : (
                <div className="h-32 sm:h-auto sm:w-32 w-full bg-muted flex items-center justify-center flex-shrink-0">
                  <ImageOff className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <CardContent className="flex-1 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.is_healthy
                      ? <CheckCircle2 className="h-4 w-4 text-success" />
                      : <AlertTriangle className="h-4 w-4 text-warning" />}
                    <h3 className="font-display font-semibold text-foreground truncate">{p.disease_name}</h3>
                    {p.crop && <Badge variant="outline">{p.crop}</Badge>}
                  </div>
                  {p.notes && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.notes}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })} · {Math.round(Number(p.confidence ?? 0))}% confidence
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => { if (confirm("Delete this prediction?")) m.mutate(p.id); }}
                  disabled={m.isPending}
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
