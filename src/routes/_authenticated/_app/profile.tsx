import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save, UserCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_app/profile")({
  head: () => ({ meta: [{ title: "Farmer Profile — Annadata AI" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const qc = useQueryClient();
  const getP = useServerFn(getMyProfile);
  const updateP = useServerFn(updateMyProfile);
  const q = useQuery({ queryKey: ["me"], queryFn: () => getP() });

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [village, setVillage] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  useEffect(() => {
    if (q.data) {
      setFullName(q.data.full_name ?? "");
      setVillage(q.data.village ?? "");
      setPhone(q.data.phone ?? "");
    }
  }, [q.data]);

  const m = useMutation({
    mutationFn: () => updateP({ data: { full_name: fullName, village, phone } }),
    onSuccess: () => {
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-2xl mx-auto">
      <header className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Your profile</h1>
        <p className="text-muted-foreground mt-1">Keep your village up to date for accurate weather.</p>
      </header>

      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display"><UserCircle className="h-5 w-5 text-primary" /> Farmer details</CardTitle>
          <CardDescription>{email}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => { e.preventDefault(); m.mutate(); }}
          >
            <div>
              <Label>Full name</Label>
              <Input maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div>
              <Label>Village / City</Label>
              <Input maxLength={100} placeholder="e.g. Anand, Gujarat" value={village} onChange={(e) => setVillage(e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input maxLength={30} type="tel" placeholder="+91 ..." value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <Button type="submit" disabled={m.isPending || q.isLoading}>
              {m.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
