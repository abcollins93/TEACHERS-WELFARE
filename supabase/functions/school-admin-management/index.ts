import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigin = "https://abcollins93.github.io";
const headers = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
  "Content-Type": "application/json",
};

function respond(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers });
}

function secretFromJson(name: string): string {
  const raw = Deno.env.get(name);
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    return String(parsed.default || "");
  } catch {
    return "";
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.headers.get("origin") && req.headers.get("origin") !== allowedOrigin) {
    return respond({ error: "Origin not allowed." }, 403);
  }
  if (req.method !== "POST") return respond({ error: "POST required." }, 405);

  const url = Deno.env.get("SUPABASE_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || secretFromJson("SUPABASE_PUBLISHABLE_KEYS");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || secretFromJson("SUPABASE_SECRET_KEYS");
  const authorization = req.headers.get("Authorization") || "";
  if (!url || !anonKey || !serviceKey) return respond({ error: "Server configuration is incomplete." }, 500);
  if (!authorization.startsWith("Bearer ")) return respond({ error: "Sign in required." }, 401);

  const token = authorization.slice(7);
  const userClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user || !user.email) return respond({ error: "Your session is invalid or expired. Sign in again." }, 401);

    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return respond({ error: "Invalid request body." }, 400); }
    const action = String(body.action || "");
    const schoolId = String(body.school_id || "");
    if (!schoolId) return respond({ error: "School context is required." }, 400);

    const { data: actor, error: actorError } = await adminClient
      .from("platform_admins")
      .select("id,user_id,username,name,school_id,active")
      .eq("user_id", user.id)
      .eq("school_id", schoolId)
      .eq("active", true)
      .maybeSingle();
    if (actorError || !actor) return respond({ error: "You do not have active administrator access to this school." }, 403);

    const { data: school, error: schoolError } = await adminClient
      .from("schools").select("id,name,school_code,status")
      .eq("id", schoolId).maybeSingle();
    if (schoolError || !school || school.status !== "active") return respond({ error: "This school is not active." }, 403);

    const writeAudit = async (actionName: string, details: string) => {
      const { error } = await adminClient.from("audit_logs").insert({
        id: crypto.randomUUID(),
        actor_name: actor.name || actor.username || user.email,
        category: "Welfare portal",
        action: actionName,
        details,
        status: "success",
        time_string: new Date().toLocaleString(),
        school_id: schoolId,
      });
      if (error) console.error("Admin management audit write failed:", error.message);
    };

    if (action === "list") {
      const { data, error } = await adminClient.from("platform_admins")
        .select("id,user_id,username,name,active,created_at")
        .eq("school_id", schoolId).order("created_at", { ascending: true });
      if (error) return respond({ error: "Administrator list could not be loaded." }, 500);
      return respond({ administrators: data || [], school_name: school.name, school_code: school.school_code });
    }

    if (action === "invite") {
      const email = String(body.email || "").trim().toLowerCase();
      const fullName = String(body.full_name || "").trim();
      const username = String(body.username || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || fullName.length < 2 || fullName.length > 120 ||
          !/^[a-zA-Z0-9._-]{3,40}$/.test(username)) {
        return respond({ error: "Enter a valid email, full name, and username (3–40 letters, numbers, dots, underscores or hyphens)." }, 400);
      }
      const { count, error: countError } = await adminClient.from("platform_admins")
        .select("id", { count: "exact", head: true }).eq("school_id", schoolId).eq("active", true);
      if (countError) return respond({ error: "Could not verify administrator capacity." }, 500);
      if ((count || 0) >= 10) return respond({ error: "This school has reached the limit of 10 active administrators." }, 409);

      const { data: duplicate, error: duplicateError } = await adminClient.from("platform_admins")
        .select("id").eq("school_id", schoolId).eq("username", username).maybeSingle();
      if (duplicateError) return respond({ error: "Could not validate the username." }, 500);
      if (duplicate) return respond({ error: "That username is already used in this school." }, 409);

      const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName, account_type: "school_admin" },
        redirectTo: "https://abcollins93.github.io/TEACHERS-WELFARE/set-password.html",
      });
      if (inviteError || !invited.user) {
        return respond({ error: "Invitation failed. The email may already be registered, or the invitation service needs attention." }, 400);
      }

      const { error: insertError } = await adminClient.from("platform_admins").insert({
        user_id: invited.user.id,
        username,
        name: fullName,
        school_id: schoolId,
        active: true,
      });
      if (insertError) {
        await adminClient.auth.admin.deleteUser(invited.user.id);
        console.error("Administrator row insert failed:", insertError.message);
        return respond({ error: "The administrator could not be attached to this school. No account was retained." }, 500);
      }
      await writeAudit("Invite school administrator", `Invitation sent to ${email}; username ${username}.`);
      return respond({ success: true, message: "Invitation sent. The administrator must use the email invitation to set a password.", email, username });
    }

    if (action === "deactivate") {
      const targetId = String(body.admin_id || "");
      if (!targetId) return respond({ error: "Choose an administrator." }, 400);
      const { data: target, error: targetError } = await adminClient.from("platform_admins")
        .select("id,user_id,username,name,active").eq("id", targetId).eq("school_id", schoolId).maybeSingle();
      if (targetError || !target) return respond({ error: "Administrator not found in this school." }, 404);
      if (target.user_id === user.id) return respond({ error: "You cannot deactivate your own signed-in account." }, 409);
      if (!target.active) return respond({ success: true, message: "This administrator is already inactive." });
      const { count, error: countError } = await adminClient.from("platform_admins")
        .select("id", { count: "exact", head: true }).eq("school_id", schoolId).eq("active", true);
      if (countError) return respond({ error: "Could not verify active administrator count." }, 500);
      if ((count || 0) <= 1) return respond({ error: "The last active administrator cannot be deactivated." }, 409);
      const { error } = await adminClient.from("platform_admins").update({ active: false })
        .eq("id", targetId).eq("school_id", schoolId);
      if (error) return respond({ error: "Administrator could not be deactivated." }, 500);
      await writeAudit("Deactivate school administrator", `Deactivated ${target.username} (${target.name || "administrator"}). Auth identity retained; school access disabled.`);
      return respond({ success: true, message: "Administrator access deactivated for this school." });
    }

    if (action === "reset") {
      const currentPassword = String(body.current_password || "");
      const confirmation = String(body.confirmation || "");
      if (confirmation !== `RESET:${school.school_code}`) {
        return respond({ error: `Type RESET:${school.school_code} exactly to confirm this school-specific reset.` }, 400);
      }
      if (!currentPassword) return respond({ error: "Enter your current password to authorize the reset." }, 400);
      const passwordClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
      const { error: passwordError } = await passwordClient.auth.signInWithPassword({ email: user.email, password: currentPassword });
      if (passwordError) return respond({ error: "Current password is incorrect. No records were changed." }, 401);
      const { data: resetResult, error: resetError } = await adminClient.rpc("reset_school_welfare_data", {
        p_school_id: schoolId,
        p_actor_user_id: user.id,
        p_confirmation: confirmation,
      });
      if (resetError || !resetResult?.success) {
        console.error("School data reset failed:", resetError?.message || "RPC did not confirm success");
        return respond({ error: "Reset failed safely. No success was reported; contact the platform administrator before retrying." }, 500);
      }
      return respond({ success: true, result: resetResult, message: "This school's member and finance records were reset. Audit history was preserved." });
    }

    return respond({ error: "Unsupported action." }, 400);
  } catch (error) {
    console.error("School administrator management failed:", error instanceof Error ? error.message : "Unknown error");
    return respond({ error: "The request could not be completed. No success is assumed." }, 500);
  }
});
