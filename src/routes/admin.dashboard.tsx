import { createFileRoute, useNavigate, useRouter, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  LogOut,
  Users,
  Eye,
  Search,
  Activity,
  LogIn,
  Sprout,
  RefreshCw,
  Loader2,
  TrendingUp,
  UserPlus,
  Trash2,
  ShieldPlus,
  MessageSquareWarning,
  KeyRound,
} from "lucide-react";

import { adminLogout, adminMe, getAdminAnalytics, addAdmin, removeAdmin, updateComplaint, deleteComplaint, changeAdminPassword, deletePrediction, deleteActivityLog } from "@/lib/admin.functions";
import { saveAdminToken } from "@/lib/admin-token-attacher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard · Annadata AI" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const router = useRouter();
  const me = useServerFn(adminMe);
  const logout = useServerFn(adminLogout);
  const fetchAnalytics = useServerFn(getAdminAnalytics);

  const meQuery = useQuery({ queryKey: ["admin-me"], queryFn: () => me() });
  const analytics = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => fetchAnalytics(),
    enabled: !!meQuery.data?.username,
    staleTime: 0,
    refetchInterval: 5_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (meQuery.isSuccess && !meQuery.data?.username) {
      saveAdminToken(null);
      navigate({ to: "/admin", search: { reason: "expired" }, replace: true });
    }
  }, [meQuery.isSuccess, meQuery.data, navigate]);

  useEffect(() => {
    if (!analytics.isError) return;
    const msg = String((analytics.error as Error)?.message ?? "");
    if (/unauthor|redirect|401/i.test(msg)) {
      saveAdminToken(null);
      navigate({ to: "/admin", search: { reason: "expired" }, replace: true });
    }
  }, [analytics.isError, analytics.error, navigate]);

  async function onLogout() {
    await logout();
    saveAdminToken(null);
    toast.success("Signed out");
    await router.invalidate();
    navigate({ to: "/admin", search: { reason: "signedout" }, replace: true });
  }

  if (meQuery.isLoading || !meQuery.data?.username) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const a = analytics.data;
  const max = a ? Math.max(1, ...a.daily.map((d) => d.events)) : 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b bg-card/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="rounded-lg bg-primary text-primary-foreground p-2 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-base sm:text-xl font-bold text-foreground truncate">Admin Dashboard</h1>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                <span className="hidden sm:inline">Signed in as </span><span className="font-semibold text-foreground">{meQuery.data.username}</span><span className="hidden sm:inline"> · Annadata AI</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Button variant="outline" size="icon" className="sm:hidden h-9 w-9" onClick={() => analytics.refetch()} aria-label="Refresh">
              <RefreshCw className={`h-4 w-4 ${analytics.isFetching ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={() => analytics.refetch()}>
              <RefreshCw className={`h-4 w-4 mr-2 ${analytics.isFetching ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Link to="/dashboard" className="hidden sm:inline-flex"><Button variant="ghost" size="sm">App</Button></Link>
            <Button variant="destructive" size="icon" className="sm:hidden h-9 w-9" onClick={onLogout} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="sm" className="hidden sm:inline-flex" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat icon={<Users className="h-4 w-4" />} label="Members" value={a?.counts.totalMembers ?? "—"} />
          <Stat icon={<Activity className="h-4 w-4" />} label="Active 24h" value={a?.counts.active24h ?? "—"} accent />
          <Stat icon={<Eye className="h-4 w-4" />} label="Page views (7d)" value={a?.counts.totalPageViews7d ?? "—"} />
          <Stat icon={<LogIn className="h-4 w-4" />} label="Logins (7d)" value={a?.counts.totalLogins7d ?? "—"} />
          <Stat icon={<Users className="h-4 w-4" />} label="Visitors (7d)" value={a?.counts.totalVisitors7d ?? "—"} />
          <Stat icon={<Search className="h-4 w-4" />} label="Searches (7d)" value={a?.counts.totalSearches7d ?? "—"} />
          <Stat icon={<Sprout className="h-4 w-4" />} label="Diagnoses total" value={a?.counts.totalPredictions ?? "—"} />
          <Stat icon={<MessageSquareWarning className="h-4 w-4" />} label="Open complaints" value={a?.counts.openComplaints ?? "—"} accent />
          <Stat icon={<MessageSquareWarning className="h-4 w-4" />} label="Complaints total" value={a?.counts.totalComplaints ?? "—"} />
          <Stat icon={<TrendingUp className="h-4 w-4" />} label="Admins" value={a?.admins.length ?? "—"} />
        </section>

        {analytics.isError && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-4 text-sm text-destructive">
              Dashboard data could not load. Click Refresh, or sign in again if the session expired.
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Daily activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Activity · last 7 days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-48">
                {a?.daily.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-xs font-semibold text-foreground">{d.events}</div>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary/60"
                      style={{ height: `${(d.events / max) * 140 + 6}px` }}
                      title={`${d.visitors} visitors · ${d.events} events`}
                    />
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(d.date).toLocaleDateString(undefined, { weekday: "short" })}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Bars = total events. Hover for unique visitors.</p>
            </CardContent>
          </Card>

          {/* Top pages */}
          <Card>
            <CardHeader>
              <CardTitle>Top pages</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(a?.topPages ?? []).map((p) => (
                  <li key={p.path} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-mono text-xs text-foreground">{p.path}</span>
                    <span className="rounded-full bg-secondary text-secondary-foreground px-2 py-0.5 text-xs font-semibold">{p.count}</span>
                  </li>
                ))}
                {a && a.topPages.length === 0 && <li className="text-sm text-muted-foreground">No page views yet.</li>}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top searches */}
          <Card>
            <CardHeader>
              <CardTitle>What users search & explore</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(a?.topSearches ?? []).map((s) => (
                  <li key={s.query} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-foreground">{s.query}</span>
                    <span className="rounded-full bg-accent text-accent-foreground px-2 py-0.5 text-xs font-semibold">{s.count}×</span>
                  </li>
                ))}
                {a && a.topSearches.length === 0 && <li className="text-sm text-muted-foreground">No search activity yet.</li>}
              </ul>
            </CardContent>
          </Card>

          {/* Recent logins */}
          <RecentSignInsCard logins={a?.recentLogins ?? []} />
        </div>


        {/* Advisor chats — who asked what */}
        <Card>
          <CardHeader>
            <CardTitle>AI Advisor conversations (latest 50)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y max-h-[28rem] overflow-auto">
              {(a?.recentAdvisorChats ?? []).map((c, i) => (
                <li key={`${c.id ?? c.user_id}-${i}`} className="py-3 flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{c.name ?? "Unnamed farmer"}</span>
                      {c.village && <span className="text-xs text-muted-foreground">· {c.village}</span>}
                    </div>
                    <p className="mt-1 text-sm text-foreground whitespace-pre-wrap break-words">{c.query}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(c.at).toLocaleString()}
                    </span>
                    <DeleteActivityLogButton id={c.id} onDone={() => analytics.refetch()} />
                  </div>
                </li>
              ))}
              {a && a.recentAdvisorChats.length === 0 && (
                <li className="py-2 text-sm text-muted-foreground">No advisor conversations yet.</li>
              )}
            </ul>
          </CardContent>
        </Card>


        {/* Complaints */}
        <ComplaintsCard complaints={a?.recentComplaints ?? []} onChanged={() => analytics.refetch()} />

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle>Members ({a?.counts.totalMembers ?? 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y max-h-96 overflow-auto">
                {(a?.members ?? []).map((m) => (
                  <li key={m.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                    <div>
                      <div className="font-medium text-foreground">{m.full_name ?? "Unnamed"}</div>
                      <div className="text-xs text-muted-foreground">{m.village ?? "—"}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Recent diagnoses */}
          <Card>
            <CardHeader>
              <CardTitle>Latest crop diagnoses</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y max-h-[28rem] overflow-auto">
                {(a?.recentPredictions ?? []).map((p) => (
                  <li key={p.id} className="py-2 flex items-start gap-3 text-sm">
                    {p.thumb_url ? (
                      <a href={p.thumb_url} target="_blank" rel="noreferrer" className="flex-shrink-0">
                        <img src={p.thumb_url} alt={p.disease_name} className="h-14 w-14 rounded object-cover border" />
                      </a>
                    ) : (
                      <div className="h-14 w-14 rounded bg-muted flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground truncate">{p.disease_name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {p.crop ?? "—"} · by {p.user_name ?? "user"} {p.user_village ? `(${p.user_village})` : ""}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(p.created_at).toLocaleString()} · {p.confidence ? `${p.confidence}%` : ""}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs ${p.is_healthy ? "text-success" : "text-warning"}`}>
                        {p.is_healthy ? "Healthy" : "Issue"}
                      </span>
                      <DeletePredictionButton id={p.id} onDone={() => analytics.refetch()} />
                    </div>
                  </li>
                ))}
                {(a?.recentPredictions ?? []).length === 0 && (
                  <li className="py-6 text-center text-xs text-muted-foreground">No diagnoses yet</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Top diseases & crops */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Top diseases detected</CardTitle></CardHeader>
            <CardContent>
              <ul className="divide-y max-h-80 overflow-auto">
                {(a?.topDiseases ?? []).map((d) => (
                  <li key={d.name} className="py-2 flex items-center justify-between text-sm">
                    <span className="truncate">{d.name}</span>
                    <Badge variant="secondary">{d.count}</Badge>
                  </li>
                ))}
                {(a?.topDiseases ?? []).length === 0 && (
                  <li className="py-6 text-center text-xs text-muted-foreground">No data yet</li>
                )}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Top crops scanned</CardTitle></CardHeader>
            <CardContent>
              <ul className="divide-y max-h-80 overflow-auto">
                {(a?.topCrops ?? []).map((c) => (
                  <li key={c.name} className="py-2 flex items-center justify-between text-sm">
                    <span className="truncate">{c.name}</span>
                    <Badge variant="secondary">{c.count}</Badge>
                  </li>
                ))}
                {(a?.topCrops ?? []).length === 0 && (
                  <li className="py-6 text-center text-xs text-muted-foreground">No data yet</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>


        {/* Live event feed */}
        <Card>
          <CardHeader>
            <CardTitle>Live event feed (latest 100)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted-foreground border-b">
                    <th className="py-2 pr-3">When</th>
                    <th className="py-2 pr-3">Event</th>
                    <th className="py-2 pr-3">Path / Query</th>
                    <th className="py-2 pr-3">Session</th>
                    <th className="py-2 pr-3">Farmer</th>
                  </tr>
                </thead>
                <tbody>
                  {(a?.recentEvents ?? []).map((e) => (
                    <tr key={e.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(e.created_at).toLocaleTimeString()}
                      </td>
                      <td className="py-2 pr-3">
                        <span className="rounded bg-secondary text-secondary-foreground px-2 py-0.5 text-xs font-medium">
                          {e.event_type}
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs text-foreground truncate max-w-xs">
                        {e.query ?? e.path ?? "—"}
                      </td>
                      <td className="py-2 pr-3 font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">
                        {e.session_id ?? "—"}
                      </td>
                      <td className="py-2 pr-3 font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">
                        {e.user_name ? `${e.user_name}${e.user_village ? ` · ${e.user_village}` : ""}` : e.user_id ?? "guest"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Admin management */}
        <AdminsCard
          me={meQuery.data.username}
          admins={a?.admins ?? []}
          onChanged={() => analytics.refetch()}
        />

        {/* Change password */}
        <ChangePasswordCard me={meQuery.data.username} admins={a?.admins ?? []} />

      </main>
    </div>
  );
}

function RecentSignInsCard({
  logins,
}: {
  logins: {
    user_id: string;
    name: string | null;
    email: string | null;
    village: string | null;
    at: string;
    count: number;
    account_created_at: string | null;
    last_activity: { at: string; event_type: string; path: string | null; query: string | null } | null;
    history: {
      id: string;
      at: string;
      source: string;
      session_id: string | null;
      path: string | null;
      ip: string | null;
      user_agent: string | null;
    }[];
  }[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent member sign-ins ({logins.length})</CardTitle>
        <p className="text-xs text-muted-foreground">Auto-updates every 5 seconds. Click a farmer to see full sign-in details.</p>
      </CardHeader>
      <CardContent>
        <ul className="divide-y max-h-[28rem] overflow-auto">
          {logins.map((l) => {
            const open = openId === l.user_id;
            return (
              <li key={l.user_id} className="py-2">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : l.user_id)}
                  className="w-full flex items-center justify-between gap-3 text-sm text-left hover:bg-accent/40 rounded-md px-2 py-1 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">{l.name ?? "Unnamed farmer"}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {l.village ?? "—"}{l.email ? ` · ${l.email}` : ""}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(l.at).toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {l.count} record{l.count === 1 ? "" : "s"} · latest {open ? "▴" : "▾"}
                    </div>
                  </div>
                </button>
                {open && (
                  <div className="mt-2 ml-2 pl-3 border-l-2 border-primary/40 space-y-3 max-h-80 overflow-auto">
                    <div className="grid sm:grid-cols-2 gap-2 rounded-md bg-muted/40 p-3 text-xs">
                      <Detail label="Farmer ID" value={l.user_id} mono />
                      <Detail label="Email" value={l.email ?? "—"} mono />
                      <Detail label="Village" value={l.village ?? "—"} />
                      <Detail label="Account created" value={l.account_created_at ? new Date(l.account_created_at).toLocaleString() : "—"} />
                      <Detail label="Last activity" value={l.last_activity ? `${l.last_activity.event_type} · ${new Date(l.last_activity.at).toLocaleString()}` : "—"} />
                      <Detail label="Last path/query" value={l.last_activity?.query ?? l.last_activity?.path ?? "—"} mono />
                    </div>
                    <div className="text-[11px] uppercase text-muted-foreground tracking-wide">
                      Sign-in records ({l.history.length})
                    </div>
                    {l.history.map((h) => (
                      <div key={h.id} className="rounded-md border bg-background/60 p-2 text-xs space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-foreground">{new Date(h.at).toLocaleString()}</span>
                          <Badge variant="secondary">{h.source.replaceAll("_", " ")}</Badge>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-x-3 gap-y-1 text-muted-foreground">
                          <span className="truncate">Session: <span className="font-mono">{h.session_id ?? "—"}</span></span>
                          <span className="truncate">Path: <span className="font-mono">{h.path ?? "—"}</span></span>
                          <span className="truncate">IP: <span className="font-mono">{h.ip ?? "—"}</span></span>
                          <span className="truncate">Browser: {h.user_agent ?? "—"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
          {logins.length === 0 && <li className="py-2 text-sm text-muted-foreground">No logins captured yet.</li>}
        </ul>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`truncate text-foreground ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}


function ComplaintsCard({
  complaints,
  onChanged,
}: {
  complaints: {
    id: string;
    user_id: string;
    category: string;
    title: string;
    message: string;
    status: string;
    priority: string;
    admin_note: string | null;
    created_at: string;
    user_name?: string | null;
    user_village?: string | null;
  }[];
  onChanged: () => void;
}) {
  const update = useServerFn(updateComplaint);
  const remove = useServerFn(deleteComplaint);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(id: string, status: string, adminNote: string | null) {
    setBusy(true);
    try {
      const res = await update({ data: { id, status, admin_note: adminNote } });
      if (!res.ok) return toast.error(res.error);
      toast.success("Complaint updated");
      setEditingId(null);
      setNote("");
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string) {
    if (!confirm("Delete this complaint permanently?")) return;
    const res = await remove({ data: { id } });
    if (!res.ok) return toast.error(res.error);
    toast.success("Complaint deleted");
    onChanged();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareWarning className="h-5 w-5 text-primary" /> Complaints raised in the app ({complaints.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {complaints.length === 0 ? (
          <p className="text-sm text-muted-foreground">No complaints have been raised yet.</p>
        ) : (
          <div className="space-y-3 max-h-[34rem] overflow-auto pr-1">
            {complaints.map((c) => {
              const editing = editingId === c.id;
              return (
                <div key={c.id} className="rounded-xl border border-border/60 p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{c.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {c.user_name ?? "Unnamed farmer"}{c.user_village ? ` · ${c.user_village}` : ""} · {new Date(c.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{c.category.replace("_", " ")}</Badge>
                      <Badge className={c.priority === "urgent" ? "bg-destructive text-destructive-foreground" : ""}>{c.priority}</Badge>
                      <Badge variant={c.status === "resolved" ? "default" : "secondary"}>{c.status}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{c.message}</p>
                  {c.admin_note && !editing && (
                    <div className="rounded-lg bg-muted p-3 text-sm text-foreground">Admin note: {c.admin_note}</div>
                  )}
                  {editing ? (
                    <div className="space-y-2">
                      <Label htmlFor={`note-${c.id}`}>Admin note</Label>
                      <Textarea id={`note-${c.id}`} value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" disabled={busy} onClick={() => save(c.id, c.status, note || null)}>Save note</Button>
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => { setEditingId(null); setNote(""); }}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <Select value={c.status} onValueChange={(status) => save(c.id, status, c.admin_note)}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="reviewing">Reviewing</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="outline" onClick={() => { setEditingId(c.id); setNote(c.admin_note ?? ""); }}>
                        Add note
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => del(c.id)} disabled={busy}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AdminsCard({
  me,
  admins,
  onChanged,
}: {
  me: string;
  admins: { id: string; username: string; created_by: string | null; created_at: string }[];
  onChanged: () => void;
}) {
  const add = useServerFn(addAdmin);
  const remove = useServerFn(removeAdmin);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await add({ data: { username, password } });
      if (!res.ok) return toast.error(res.error);
      toast.success(`Admin ${username} added`);
      setUsername("");
      setPassword("");
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(name: string) {
    if (!confirm(`Remove admin "${name}"?`)) return;
    const res = await remove({ data: { username: name } });
    if (!res.ok) return toast.error(res.error);
    toast.success(`Admin ${name} removed`);
    onChanged();
  }

  const isPrimary = me === "sasi";
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldPlus className="h-5 w-5 text-primary" /> Admins ({admins.length})
        </CardTitle>
        {!isPrimary && (
          <p className="text-xs text-muted-foreground">
            Only the primary admin (<span className="font-mono">sasi</span>) can add or remove admins.
          </p>
        )}
      </CardHeader>
      <CardContent className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={onAdd} className={`space-y-3 rounded-xl border bg-secondary/30 p-4 ${!isPrimary ? "opacity-60 pointer-events-none" : ""}`}>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <UserPlus className="h-4 w-4 text-primary" /> Add a new admin
          </div>
          <p className="text-xs text-muted-foreground">
            New admins can sign in at <span className="font-mono">/admin</span> and see this same dashboard.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="new-admin-username">Username</Label>
            <Input id="new-admin-username" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. ravi" autoComplete="off" disabled={!isPrimary} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-admin-password">Password</Label>
            <Input id="new-admin-password" type="password" required minLength={4} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" disabled={!isPrimary} />
          </div>
          <Button type="submit" disabled={busy || !isPrimary} className="w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
            Create admin
          </Button>
        </form>

        <div className="rounded-xl border">
          <div className="px-4 py-2 text-sm font-semibold text-foreground border-b bg-muted/30">
            Existing admins
          </div>
          <ul className="divide-y max-h-72 overflow-auto">
            {admins.map((ad) => {
              const isSasi = ad.username === "sasi";
              const canRemove = isPrimary && !isSasi;
              return (
                <li key={ad.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                  <div>
                    <div className="font-medium text-foreground">
                      {ad.username}
                      {isSasi && <span className="ml-2 rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[10px] font-semibold">PRIMARY</span>}
                      {ad.username === me && !isSasi && <span className="ml-2 rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[10px] font-semibold">YOU</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Added {new Date(ad.created_at).toLocaleDateString()} · by {ad.created_by ?? "—"}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={!canRemove}
                    title={isSasi ? "Primary admin cannot be removed" : !isPrimary ? "Only sasi can remove admins" : "Remove admin"}
                    onClick={() => onRemove(ad.username)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}


function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <Card className={accent ? "border-primary/40 bg-primary/5" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          <div className="text-muted-foreground">{icon}</div>
        </div>
        <div className="mt-1 font-display text-2xl font-bold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}

function ChangePasswordCard({
  me,
  admins,
}: {
  me: string;
  admins: { username: string }[];
}) {
  const change = useServerFn(changeAdminPassword);
  const isPrimary = me === "sasi";
  const [target, setTarget] = useState(me);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const changingSelf = target === me;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 4) return toast.error("New password must be at least 4 characters");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");
    setBusy(true);
    try {
      const res = await change({
        data: {
          currentPassword,
          newPassword,
          targetUsername: changingSelf ? "" : target,
        },
      });
      if (!res.ok) return toast.error(res.error);
      toast.success(changingSelf ? "Your password has been updated" : `Password updated for ${target}`);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" /> Change admin password
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Update your own admin password.
          {isPrimary && " As the primary admin, you can also reset another admin's password without their current one."}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-4 max-w-2xl">
          {isPrimary && admins.length > 1 && (
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="cp-target">Admin to update</Label>
              <select
                id="cp-target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {admins.map((a) => (
                  <option key={a.username} value={a.username}>
                    {a.username}
                    {a.username === me ? " (you)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
          {changingSelf && (
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="cp-current">Current password</Label>
              <Input
                id="cp-current"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="cp-new">New password</Label>
            <Input
              id="cp-new"
              type="password"
              required
              minLength={4}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-confirm">Confirm new password</Label>
            <Input
              id="cp-confirm"
              type="password"
              required
              minLength={4}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
              Update password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function DeletePredictionButton({ id, onDone }: { id: string; onDone: () => void }) {
  const del = useServerFn(deletePrediction);
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 text-destructive"
      disabled={busy}
      onClick={async () => {
        if (!confirm("Delete this diagnosis? This cannot be undone.")) return;
        setBusy(true);
        const res = await del({ data: { id } });
        setBusy(false);
        if (res?.ok) {
          toast.success("Diagnosis deleted");
          onDone();
        } else {
          toast.error(res?.error ?? "Failed to delete");
        }
      }}
      aria-label="Delete diagnosis"
    >
      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
    </Button>
  );
}

function DeleteActivityLogButton({ id, onDone }: { id: string; onDone: () => void }) {
  const del = useServerFn(deleteActivityLog);
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 px-2 text-destructive"
      disabled={busy}
      onClick={async () => {
        if (!confirm("Delete this conversation entry?")) return;
        setBusy(true);
        const res = await del({ data: { id } });
        setBusy(false);
        if (res?.ok) {
          toast.success("Conversation deleted");
          onDone();
        } else {
          toast.error(res?.error ?? "Failed to delete");
        }
      }}
      aria-label="Delete conversation"
    >
      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
    </Button>
  );
}



