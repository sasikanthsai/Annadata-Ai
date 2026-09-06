import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "system";
export type Accent = "forest" | "sky" | "sunset" | "amber" | "violet";

type Ctx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  accent: Accent;
  setAccent: (a: Accent) => void;
  resolved: "light" | "dark";
};

const ThemeCtx = createContext<Ctx>({
  theme: "system", setTheme: () => {}, accent: "forest", setAccent: () => {}, resolved: "light",
});

function resolve(t: Theme): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  if (t === "system") return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  return t;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem("km.theme") as Theme) || "system";
  });
  const [accent, setAccentState] = useState<Accent>(() => {
    if (typeof window === "undefined") return "forest";
    return (localStorage.getItem("km.accent") as Accent) || "forest";
  });
  const [resolved, setResolved] = useState<"light" | "dark">(() => resolve(theme));

  useEffect(() => {
    const r = resolve(theme);
    setResolved(r);
    document.documentElement.classList.toggle("dark", r === "dark");
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const cb = () => {
        const nr = mq.matches ? "dark" : "light";
        setResolved(nr);
        document.documentElement.classList.toggle("dark", nr === "dark");
      };
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.accent = accent;
  }, [accent]);

  const value = useMemo<Ctx>(() => ({
    theme, accent, resolved,
    setTheme: (t) => { setThemeState(t); localStorage.setItem("km.theme", t); },
    setAccent: (a) => { setAccentState(a); localStorage.setItem("km.accent", a); },
  }), [theme, accent, resolved]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);

export const ACCENTS: { id: Accent; label: string; swatch: string }[] = [
  { id: "forest", label: "Forest", swatch: "oklch(0.48 0.10 155)" },
  { id: "sky", label: "Sky", swatch: "oklch(0.55 0.16 230)" },
  { id: "sunset", label: "Sunset", swatch: "oklch(0.62 0.21 30)" },
  { id: "amber", label: "Amber", swatch: "oklch(0.72 0.17 75)" },
  { id: "violet", label: "Violet", swatch: "oklch(0.55 0.20 295)" },
];
