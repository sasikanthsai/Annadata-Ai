import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Leaf, LayoutDashboard, History, UserCircle, LogOut, Menu, X, Sparkles, CalendarDays, Settings as SettingsIcon, Moon, Sun, MessageSquareWarning, CloudSun, Languages, Landmark, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useI18n, LANG_LABELS, type Lang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/_app")({
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { t, lang, setLang } = useI18n();
  const { resolved, setTheme } = useTheme();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = [
    { to: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { to: "/advisor", label: t("advisor"), icon: Sparkles },
    { to: "/crop-intel", label: t("cropWeather"), icon: CloudSun },
    { to: "/fertilizer-prices", label: t("fertilizerPrices"), icon: ShoppingCart },
    { to: "/calendar", label: t("calendar"), icon: CalendarDays },
    { to: "/schemes", label: t("schemes"), icon: Landmark },
    { to: "/history", label: t("history"), icon: History },
    { to: "/complaints", label: t("complaints"), icon: MessageSquareWarning },
    { to: "/profile", label: t("profile"), icon: UserCircle },
    { to: "/settings", label: t("settings"), icon: SettingsIcon },
  ] as const;

  const langSelector = (
    <div className="flex items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-2 py-1.5">
      <Languages className="h-4 w-4 text-sidebar-primary shrink-0" />
      <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
        <SelectTrigger className="h-7 w-full border-0 bg-transparent px-1 text-sidebar-foreground focus:ring-0 focus:ring-offset-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
            <SelectItem key={l} value={l}>{LANG_LABELS[l]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const navList = (onClick?: () => void) => nav.map(({ to, label, icon: Icon }) => {
    const active = pathname === to;
    return (
      <Link
        key={to}
        to={to}
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-smooth ${
          active ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-soft" : "hover:bg-sidebar-accent"
        }`}
      >
        <Icon className="h-4 w-4" /> {label}
      </Link>
    );
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <aside className="hidden md:flex md:w-64 md:flex-col bg-sidebar text-sidebar-foreground sticky top-0 h-screen">
        <div className="p-5 pb-3 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-2 text-sidebar-primary font-display text-xl font-bold">
            <Leaf className="h-6 w-6" /> {t("appName")}
          </Link>
        </div>
        <nav className="flex-1 min-h-0 overflow-y-auto px-5 space-y-1">{navList()}</nav>

        <div className="shrink-0 space-y-2 p-5 pt-3 border-t border-sidebar-border bg-sidebar">
          {langSelector}
          <Button variant="ghost" onClick={() => setTheme(resolved === "dark" ? "light" : "dark")} className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground">
            {resolved === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            {resolved === "dark" ? t("lightMode") : t("darkMode")}
          </Button>
          <Button variant="destructive" onClick={signOut} className="w-full justify-start">
            <LogOut className="mr-2 h-4 w-4" /> {t("signOut")}
          </Button>
        </div>
      </aside>

      <header className="md:hidden flex items-center justify-between bg-sidebar text-sidebar-foreground p-4 sticky top-0 z-30">
        <Link to="/dashboard" className="flex items-center gap-2 text-sidebar-primary font-display text-lg font-bold">
          <Leaf className="h-5 w-5" /> {t("appName")}
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground">
          {open ? <X /> : <Menu />}
        </Button>
      </header>
      {open && (
        <nav className="md:hidden bg-sidebar text-sidebar-foreground p-4 space-y-2 border-t border-sidebar-border">
          {navList(() => setOpen(false))}
          {langSelector}
          <Button variant="ghost" onClick={() => setTheme(resolved === "dark" ? "light" : "dark")} className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground">
            {resolved === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />} {t("toggleTheme")}
          </Button>
          <button onClick={signOut} className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent">
            <LogOut className="h-4 w-4" /> {t("signOut")}
          </button>
        </nav>
      )}

      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
