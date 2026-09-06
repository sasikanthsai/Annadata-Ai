import { supabase } from "@/integrations/supabase/client";

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }

  return data;
}