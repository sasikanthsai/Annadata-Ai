import { createFileRoute, Outlet, useNavigate, useRouter, useRouterState, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ShieldCheck, Loader2, KeyRound, UserCog, AlertTriangle } from "lucide-react";
import { adminLogin, adminMe } from "@/lib/admin.functions";
import { saveAdminToken } from "@/lib/admin-token-attacher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

type AdminSearch = { reason?: "expired" | "required" | "signedout" };

export const Route = createFileRoute("/admin")({
  validateSearch: (s: Record<string, unknown>): AdminSearch => {
    const r = s?.reason;
    return r === "expired" || r === "required" || r === "signedout" ? { reason: r } : {};
  },
  head: () => ({
    meta: [
      { title: "Admin · Annadata AI" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminRoute,
});

function AdminRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname !== "/admin") return <Outlet />;
  return <AdminGate />;
}

function AdminGate() {
  const navigate = useNavigate();
  const router = useRouter();
  const search = useSearch({ from: "/admin" }) as AdminSearch;
  const login = useServerFn(adminLogin);
  const me = useServerFn(adminMe);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    me().then((res) => {
      if (res.username && !search.reason) {
        navigate({ to: "/admin/dashboard", replace: true });
      } else {
        if (search.reason) saveAdminToken(null);
        setChecking(false);
      }
    }).catch(() => setChecking(false));
  }, [me, navigate, search.reason]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await login({ data: { username, password } });
      if (!res.ok) {
        toast.error(res.error ?? "Invalid credentials");
        return;
      }
      saveAdminToken(res.token);
      toast.success(`Welcome back, ${res.username}`);
      await router.invalidate();
      navigate({ to: "/admin/dashboard", replace: true });
    } catch (err) {
      toast.error((err as Error).message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/20 px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-xl bg-primary text-primary-foreground p-3">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Admin Console</h1>
            <p className="text-sm text-muted-foreground">Restricted access · Annadata AI</p>
          </div>
        </div>

        {search.reason && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>
              {search.reason === "signedout" ? "Signed out" : "Please sign in again"}
            </AlertTitle>
            <AlertDescription>
              {search.reason === "expired" && "Your admin session has expired or was not accepted by this browser. Sign in again to continue."}
              {search.reason === "required" && "You need to sign in as an admin to view that page."}
              {search.reason === "signedout" && "You've been signed out of the admin console."}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="admin-username" className="flex items-center gap-1.5"><UserCog className="h-3.5 w-3.5" /> Username</Label>
            <Input
              id="admin-username"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your admin username"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-password" className="flex items-center gap-1.5"><KeyRound className="h-3.5 w-3.5" /> Password</Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-xs text-muted-foreground text-center">
          Authorized admins only. All sign-in attempts are logged.
        </p>
      </div>
    </div>
  );
}
