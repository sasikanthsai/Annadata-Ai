import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdvisorChat } from "@/components/AdvisorChat";
import { getMyProfile } from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated/_app/advisor")({
  head: () => ({ meta: [{ title: "AI Advisor — Annadata AI" }] }),
  component: AdvisorPage,
});

function AdvisorPage() {
  const fetchProfile = useServerFn(getMyProfile);
  const profileQ = useQuery({ queryKey: ["me"], queryFn: () => fetchProfile() });
  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold">AI Crop Advisor</h1>
        <p className="text-sm text-muted-foreground mt-1">Chat in your language. Tap the mic to speak, tap the speaker to hear answers.</p>
      </header>
      <AdvisorChat village={profileQ.data?.village} crop={null} />
    </div>
  );
}
