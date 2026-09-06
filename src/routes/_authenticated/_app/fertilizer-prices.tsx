import { createFileRoute } from "@tanstack/react-router";
import { FertilizerPrices } from "@/components/FertilizerPrices";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/_app/fertilizer-prices")({
  head: () => ({ meta: [{ title: "Fertilizer & Input Prices — Annadata AI" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q.slice(0, 80) : undefined,
  }),
  component: FertilizerPricesPage,
});

function FertilizerPricesPage() {
  const { t } = useI18n();
  const { q } = Route.useSearch();
  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">{t("fertilizerPrices")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("fertilizerPricesHint")}</p>
      </header>
      <FertilizerPrices initialQuery={q} />
    </div>
  );
}
