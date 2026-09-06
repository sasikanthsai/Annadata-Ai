import { useEffect, useRef, useState } from "react";
import { fertilizerImage } from "@/lib/fertilizer-images";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ShoppingCart, ExternalLink, IndianRupee } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { VoiceInput } from "@/components/VoiceInput";
import { useServerFn } from "@tanstack/react-start";
import { getFertilizerPrices, type FertilizerPriceResult } from "@/lib/fertilizer.functions";
import { toast } from "sonner";

const PLATFORMS: { name: string; url: (q: string) => string }[] = [
  { name: "Amazon", url: (q) => `https://www.amazon.in/s?k=${encodeURIComponent(q)}` },
  { name: "Flipkart", url: (q) => `https://www.flipkart.com/search?q=${encodeURIComponent(q)}` },
  { name: "BigHaat", url: (q) => `https://www.bighaat.com/search?q=${encodeURIComponent(q)}` },
  { name: "AgriBegri", url: (q) => `https://agribegri.com/search-result.php?search=${encodeURIComponent(q)}` },
  { name: "IndiaMART", url: (q) => `https://dir.indiamart.com/search.mp?ss=${encodeURIComponent(q)}` },
];

function linkFor(platform: string, product: string) {
  const p = PLATFORMS.find((x) => platform.toLowerCase().includes(x.name.toLowerCase()));
  return (p ?? PLATFORMS[0]).url(product);
}

const SUGGESTIONS = ["Urea 45 kg", "DAP", "NPK 19:19:19", "Potash (MOP)", "Neem oil", "Vermicompost"];

export function FertilizerPrices({ initialQuery }: { initialQuery?: string }) {
  const { t, lang } = useI18n();
  const [query, setQuery] = useState(initialQuery ?? "");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FertilizerPriceResult | null>(null);
  const priceFn = useServerFn(getFertilizerPrices);

  async function search(q?: string) {
    const product = (q ?? query).trim();
    if (product.length < 2) {
      toast.error(t("enterProductName"));
      return;
    }
    setQuery(product);
    setLoading(true);
    setData(null);
    try {
      const res = await priceFn({ data: { product, language: lang } });
      setData(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const autoRan = useRef("");
  useEffect(() => {
    const q = (initialQuery ?? "").trim();
    if (q.length >= 2 && autoRan.current !== q) {
      autoRan.current = q;
      setQuery(q);
      void search(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <ShoppingCart className="h-5 w-5 text-primary" /> {t("fertilizerPrices")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{t("fertilizerPricesHint")}</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void search();
          }}
          className="flex gap-2"
        >
          <Input
            placeholder={t("productPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={80}
          />
          <VoiceInput onTranscript={(txt) => setQuery(txt.trim())} title={t("speakToType")} />
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void search(s)}
              className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground hover:bg-muted transition-smooth"
            >
              {s}
            </button>
          ))}
        </div>

        {loading && <p className="text-sm text-muted-foreground">{t("loadingPrices")}</p>}

        {data && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/40 p-3">
              <img
                src={fertilizerImage(data.product)}
                alt={data.product}
                loading="lazy"
                width={512}
                height={512}
                className="h-20 w-20 rounded-md object-cover bg-background"
              />
              <div className="min-w-0">
                <div className="font-display font-bold text-foreground truncate">{data.product}</div>
                {data.summary && <p className="text-sm text-muted-foreground">{data.summary}</p>}
              </div>
            </div>
            <ul className="grid md:grid-cols-2 gap-2">
              {data.offers.map((o, i) => (
                <li
                  key={`${o.platform}-${i}`}
                  className="rounded-lg border border-border/60 bg-background/60 p-3 space-y-1"
                >
                  <img
                    src={fertilizerImage(`${data.product} ${o.pack}`)}
                    alt={`${data.product} — ${o.platform}`}
                    loading="lazy"
                    width={512}
                    height={512}
                    className="h-28 w-full rounded-md object-contain bg-muted/40"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">{o.platform}</span>
                    <span className="inline-flex items-center gap-0.5 font-display font-bold text-primary">
                      <IndianRupee className="h-3.5 w-3.5" />
                      {o.price_range_inr.replace(/[₹]/g, "")}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">{o.pack}</div>
                  {o.note && <div className="text-xs text-muted-foreground">{o.note}</div>}
                  <a
                    href={linkFor(o.platform, data.product)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary underline inline-flex items-center gap-1"
                  >
                    {t("buyOn")} {o.platform} <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">{t("priceDisclaimer")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
