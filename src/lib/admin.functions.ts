import { createServerFn } from "@tanstack/react-start";
import { useSession, getRequestIP, getRequestHeader } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";
import {
  adminSessionConfig,
  verifyAdminCredentials,
  hashPassword,
  normalizeUsername,
  createAdminAccessToken,
  verifyAdminAccessToken,
  type AdminSession,
} from "./admin-session";

async function requireAdmin() {
  const session = await useSession<AdminSession>(adminSessionConfig);
  const username = session.data.username ?? verifyAdminAccessToken(getRequestHeader("x-annadata-admin-token"));
  if (!username) {
    throw redirect({ to: "/admin" });
  }
  return username;
}

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { username: string; password: string }) => ({
    username: normalizeUsername(data?.username ?? ""),
    password: String(data?.password ?? ""),
  }))
  .handler(async ({ data }) => {
    const ok = await verifyAdminCredentials(data.username, data.password);
    if (!ok) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("activity_logs").insert({
          event_type: "admin_login_failed",
          metadata: { attempted_username: data.username } as never,
          user_agent: getRequestHeader("user-agent") ?? null,
          ip: (() => { try { return getRequestIP({ xForwardedFor: true }) ?? null; } catch { return null; } })(),
        });
      } catch {}
      return { ok: false as const, error: "Invalid username or password" };
    }
    const session = await useSession<AdminSession>(adminSessionConfig);
    await session.update({ username: data.username, loggedInAt: Date.now() });
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("activity_logs").insert({
        event_type: "admin_login",
        metadata: { username: data.username } as never,
        user_agent: getRequestHeader("user-agent") ?? null,
        ip: (() => { try { return getRequestIP({ xForwardedFor: true }) ?? null; } catch { return null; } })(),
      });
    } catch {}
    return { ok: true as const, username: data.username, token: createAdminAccessToken(data.username) };
  });


export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<AdminSession>(adminSessionConfig);
  await session.clear();
  return { ok: true as const };
});

export const adminMe = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<AdminSession>(adminSessionConfig);
  return { username: session.data.username ?? verifyAdminAccessToken(getRequestHeader("x-annadata-admin-token")) ?? null };
});

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];
type Row = {
  id: string;
  user_id: string | null;
  session_id: string | null;
  event_type: string;
  path: string | null;
  query: string | null;
  metadata: Json | null;
  user_agent: string | null;
  ip: string | null;
  created_at: string;
};

export const getAdminAnalytics = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [recentRes, allRes, loginHistoryRes, profilesRes, predictionsRes, adminsRes, complaintsRes] = await Promise.all([
    supabaseAdmin
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200),
    supabaseAdmin
      .from("activity_logs")
      .select("id, event_type, user_id, session_id, path, query, created_at")
      .gte("created_at", since7d)
      .order("created_at", { ascending: false })
      .limit(5000),
    supabaseAdmin
      .from("activity_logs")
      .select("id, user_id, session_id, path, metadata, user_agent, ip, created_at")
      .eq("event_type", "user_login")
      .gte("created_at", since30d)
      .order("created_at", { ascending: false })
      .limit(10000),
    supabaseAdmin.from("profiles").select("id, full_name, village, created_at"),
    supabaseAdmin
      .from("predictions")
      .select("id, user_id, disease_name, crop, is_healthy, confidence, image_url, notes, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabaseAdmin
      .from("admin_users")
      .select("id, username, created_by, created_at")
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("complaints")
      .select("id, user_id, category, title, message, status, priority, admin_note, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);


  const recent = (recentRes.data ?? []) as Row[];
  const all = (allRes.data ?? []) as Pick<Row, "id" | "event_type" | "user_id" | "session_id" | "path" | "query" | "created_at">[];
  const loginRows = (loginHistoryRes.data ?? []) as Pick<Row, "id" | "user_id" | "session_id" | "path" | "metadata" | "user_agent" | "ip" | "created_at">[];
  const profiles = profilesRes.data ?? [];
  const predictions = predictionsRes.data ?? [];
  const admins = (adminsRes.data ?? []) as { id: string; username: string; created_by: string | null; created_at: string }[];
  const complaints = complaintsRes.data ?? [];



  const totalVisitors7d = new Set(all.filter((r) => r.session_id).map((r) => r.session_id!)).size;
  const activityLogins7d = loginRows.filter((r) => new Date(r.created_at).getTime() >= new Date(since7d).getTime()).length;
  const totalPageViews7d = all.filter((r) => r.event_type === "page_view").length;
  const totalSearches7d = all.filter((r) => r.event_type === "search" || r.event_type === "advisor_chat" || r.event_type === "weather_lookup").length;
  const since24hMs = Date.now() - 24 * 60 * 60 * 1000;
  const active24h = new Set(
    all
      .filter((r) => new Date(r.created_at).getTime() >= since24hMs && r.session_id)
      .map((r) => r.session_id!),
  ).size;

  // page popularity
  const pathCounts = new Map<string, number>();
  for (const r of all) {
    if (r.event_type !== "page_view" || !r.path) continue;
    pathCounts.set(r.path, (pathCounts.get(r.path) ?? 0) + 1);
  }
  const topPages = [...pathCounts.entries()]
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // search terms
  const searchCounts = new Map<string, number>();
  for (const r of all) {
    if (!(r.event_type === "search" || r.event_type === "advisor_chat" || r.event_type === "weather_lookup")) continue;
    const q = (r.query ?? "").trim().toLowerCase();
    if (!q) continue;
    searchCounts.set(q, (searchCounts.get(q) ?? 0) + 1);
  }
  const topSearches = [...searchCounts.entries()]
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // daily activity for last 7 days
  const daily: { date: string; visitors: number; events: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const dayRows = all.filter((r) => {
      const t = new Date(r.created_at).getTime();
      return t >= day.getTime() && t < next.getTime();
    });
    const visitors = new Set(dayRows.filter((r) => r.session_id).map((r) => r.session_id!)).size;
    daily.push({
      date: day.toISOString().slice(0, 10),
      visitors,
      events: dayRows.length,
    });
  }

  // who logged in — dedupe by user, most-recent first, with login count
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const lastEventByUser = new Map<string, { at: string; event_type: string; path: string | null; query: string | null }>();
  for (const r of all) {
    if (!r.user_id) continue;
    const cur = lastEventByUser.get(r.user_id);
    if (!cur || new Date(r.created_at).getTime() > new Date(cur.at).getTime()) {
      lastEventByUser.set(r.user_id, { at: r.created_at, event_type: r.event_type, path: r.path, query: r.query });
    }
  }
  type LoginDetail = {
    id: string;
    at: string;
    source: string;
    session_id: string | null;
    path: string | null;
    ip: string | null;
    user_agent: string | null;
  };
  const loginMap = new Map<string, { user_id: string; at: string; count: number; history: LoginDetail[]; email: string | null; account_created_at: string | null }>();
  const addLoginDetail = (userId: string, detail: LoginDetail, email: string | null = null, accountCreatedAt: string | null = null) => {
    const cur = loginMap.get(userId);
    if (!cur) {
      loginMap.set(userId, { user_id: userId, at: detail.at, count: 1, history: [detail], email, account_created_at: accountCreatedAt });
      return;
    }
    if (email && !cur.email) cur.email = email;
    if (accountCreatedAt && !cur.account_created_at) cur.account_created_at = accountCreatedAt;
    const detailTime = new Date(detail.at).getTime();
    const exists = cur.history.some((h) => {
      const sameStoredRow = h.id === detail.id || (h.at === detail.at && h.source === detail.source);
      const sameRealLogin = Math.abs(new Date(h.at).getTime() - detailTime) <= 15_000;
      return sameStoredRow || sameRealLogin;
    });
    if (!exists) cur.history.push(detail);
    cur.count = cur.history.length;
    if (new Date(detail.at).getTime() > new Date(cur.at).getTime()) cur.at = detail.at;
  };
  for (const r of loginRows) {
    if (!r.user_id) continue;
    const meta = r.metadata && typeof r.metadata === "object" && !Array.isArray(r.metadata) ? r.metadata as Record<string, unknown> : {};
    const source = typeof meta.source === "string" ? meta.source : "app_session";
    addLoginDetail(r.user_id, {
      id: r.id,
      at: r.created_at,
      source,
      session_id: r.session_id,
      path: r.path,
      ip: r.ip,
      user_agent: r.user_agent,
    });
  }

  let authSignIns7d = 0;

  // Enrich with auth users so members show up even if activity logging was
  // blocked by a browser, OAuth redirect timing, or old versions of the app.
  try {
    for (let page = 1; page <= 5; page++) {
      const { data: authList } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      const users = authList?.users ?? [];
      for (const u of users) {
        const authAt = u.last_sign_in_at ?? u.created_at;
        if (!authAt) continue;
        if (u.last_sign_in_at && new Date(u.last_sign_in_at).getTime() >= new Date(since7d).getTime()) authSignIns7d += 1;
        addLoginDetail(u.id, {
          id: `auth-${u.id}-${authAt}`,
          at: authAt,
          source: u.last_sign_in_at ? "backend_last_sign_in" : "account_created",
          session_id: null,
          path: null,
          ip: null,
          user_agent: null,
        }, u.email ?? null, u.created_at ?? null);
      }
      if (users.length < 1000) break;
    }
  } catch {
    // ignore — fall back to activity-log-only sign-ins
  }

  // Final fallback: if a profile exists but auth/listUsers did not return it,
  // still show the farmer in the sign-ins card with the account-created time.
  for (const p of profiles) {
    if (!loginMap.has(p.id)) {
      addLoginDetail(p.id, {
        id: `profile-${p.id}-${p.created_at}`,
        at: p.created_at,
        source: "profile_created",
        session_id: null,
        path: null,
        ip: null,
        user_agent: null,
      }, null, p.created_at);
    }
  }

  const recentLogins = [...loginMap.values()]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 100)
    .map((r) => {
      const p = profileById.get(r.user_id);
      return {
        user_id: r.user_id,
        name: p?.full_name ?? null,
        email: r.email,
        village: p?.village ?? null,
        at: r.at,
        count: r.count,
        account_created_at: r.account_created_at ?? p?.created_at ?? null,
        last_activity: lastEventByUser.get(r.user_id) ?? null,
        history: r.history.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 100),
      };
    });

  // Advisor chat transcripts — who asked what
  const recentAdvisorChats = all
    .filter((r) => r.event_type === "advisor_chat" && (r.query ?? "").trim())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 50)
    .map((r) => {
      const p = r.user_id ? profileById.get(r.user_id) : null;
      return {
        id: r.id,
        user_id: r.user_id,
        name: p?.full_name ?? null,
        village: p?.village ?? null,
        query: r.query!,
        at: r.created_at,
      };
    });


  const recentEvents = recent.slice(0, 100).map((event) => {
    const prof = event.user_id ? profileById.get(event.user_id) : null;
    return {
      ...event,
      user_name: prof?.full_name ?? null,
      user_village: prof?.village ?? null,
    };
  });

  const recentComplaints = complaints.slice(0, 50).map((complaint) => {
    const prof = complaint.user_id ? profileById.get(complaint.user_id) : null;
    return {
      ...complaint,
      user_name: prof?.full_name ?? null,
      user_village: prof?.village ?? null,
    };
  });

  return {
    counts: {
      totalVisitors7d,
      totalLogins7d: Math.max(activityLogins7d, authSignIns7d),
      totalPageViews7d,
      totalSearches7d,
      active24h,
      totalMembers: profiles.length,
      totalPredictions: predictions.length,
      totalComplaints: complaints.length,
      openComplaints: complaints.filter((c) => c.status !== "resolved").length,
    },
    daily,
    topPages,
    topSearches,
    recentEvents,
    recentLogins,
    recentAdvisorChats,
    recentComplaints,
    recentPredictions: await Promise.all(
      predictions.slice(0, 25).map(async (p) => {
        const prof = profileById.get(p.user_id);
        let thumb_url: string | null = null;
        if (p.image_url) {
          const { data: signed } = await supabaseAdmin.storage
            .from("crop-images")
            .createSignedUrl(p.image_url, 60 * 60 * 6);
          thumb_url = signed?.signedUrl ?? null;
        }
        return { ...p, user_name: prof?.full_name ?? null, user_village: prof?.village ?? null, thumb_url };
      }),
    ),
    topDiseases: (() => {
      const m = new Map<string, number>();
      for (const p of predictions) {
        if (p.is_healthy) continue;
        const k = p.disease_name || "Unknown";
        m.set(k, (m.get(k) ?? 0) + 1);
      }
      return [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);
    })(),
    topCrops: (() => {
      const m = new Map<string, number>();
      for (const p of predictions) {
        const k = (p.crop ?? "").trim();
        if (!k) continue;
        m.set(k, (m.get(k) ?? 0) + 1);
      }
      return [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);
    })(),
    members: profiles
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50),
    admins,
  };
});

export const updateComplaint = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; status: string; admin_note?: string | null }) => ({
    id: String(data?.id ?? ""),
    status: String(data?.status ?? "open"),
    admin_note: data?.admin_note ? String(data.admin_note).slice(0, 1000) : null,
  }))
  .handler(async ({ data }) => {
    await requireAdmin();
    if (!data.id) return { ok: false as const, error: "Complaint not found" };
    if (!["open", "reviewing", "resolved"].includes(data.status)) {
      return { ok: false as const, error: "Invalid status" };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("complaints")
      .update({ status: data.status, admin_note: data.admin_note })
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const deleteComplaint = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => ({ id: String(data?.id ?? "") }))
  .handler(async ({ data }) => {
    await requireAdmin();
    if (!data.id) return { ok: false as const, error: "Complaint not found" };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("complaints").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const addAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: { username: string; password: string }) => ({
    username: normalizeUsername(data?.username ?? ""),
    password: String(data?.password ?? ""),
  }))
  .handler(async ({ data }) => {
    const me = await requireAdmin();
    if (me !== "sasi") {
      return { ok: false as const, error: "Only the primary admin (sasi) can add admins" };
    }
    if (!/^[a-z0-9_.-]{3,32}$/.test(data.username)) {
      return { ok: false as const, error: "Username must be 3–32 chars (a–z, 0–9, _.-)" };
    }
    if (data.password.length < 4) {
      return { ok: false as const, error: "Password must be at least 4 characters" };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("admin_users").insert({
      username: data.username,
      password_hash: hashPassword(data.password),
      created_by: me,
    });
    if (error) {
      if (error.code === "23505") return { ok: false as const, error: "That admin username already exists" };
      return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  });

export const removeAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: { username: string }) => ({ username: normalizeUsername(data?.username ?? "") }))
  .handler(async ({ data }) => {
    const me = await requireAdmin();
    if (me !== "sasi") {
      return { ok: false as const, error: "Only the primary admin (sasi) can remove admins" };
    }
    if (data.username === "sasi") {
      return { ok: false as const, error: "The primary admin (sasi) cannot be removed" };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("admin_users").delete().eq("username", data.username);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const changeAdminPassword = createServerFn({ method: "POST" })
  .inputValidator((data: { currentPassword: string; newPassword: string; targetUsername?: string }) => ({
    currentPassword: String(data?.currentPassword ?? ""),
    newPassword: String(data?.newPassword ?? ""),
    targetUsername: data?.targetUsername ? normalizeUsername(data.targetUsername) : "",
  }))
  .handler(async ({ data }) => {
    const me = await requireAdmin();
    const target = data.targetUsername || me;
    // Only primary admin (sasi) can change another admin's password
    if (target !== me && me !== "sasi") {
      return { ok: false as const, error: "Only the primary admin (sasi) can change another admin's password" };
    }
    if (data.newPassword.length < 4) {
      return { ok: false as const, error: "New password must be at least 4 characters" };
    }
    // Changing your own password requires the current one. Primary admin changing someone else's does not.
    if (target === me) {
      const ok = await verifyAdminCredentials(me, data.currentPassword);
      if (!ok) return { ok: false as const, error: "Current password is incorrect" };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("admin_users")
      .update({ password_hash: hashPassword(data.newPassword) })
      .eq("username", target);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const deletePrediction = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => ({ id: String(data?.id ?? "") }))
  .handler(async ({ data }) => {
    await requireAdmin();
    if (!data.id) return { ok: false as const, error: "Prediction not found" };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("predictions").select("image_url").eq("id", data.id).maybeSingle();
    if (row?.image_url) {
      await supabaseAdmin.storage.from("crop-images").remove([row.image_url]);
    }
    const { error } = await supabaseAdmin.from("predictions").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const deleteActivityLog = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => ({ id: String(data?.id ?? "") }))
  .handler(async ({ data }) => {
    await requireAdmin();
    if (!data.id) return { ok: false as const, error: "Entry not found" };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("activity_logs").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });






