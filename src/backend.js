// Data layer: everything the app reads or writes goes through here (Supabase: Postgres + Auth + Realtime).
import { createClient } from "@supabase/supabase-js";

const env = (import.meta && import.meta.env) || (typeof window !== "undefined" && window.__TB_ENV) || {};
const URL_ = env.VITE_SUPABASE_URL || "";
const KEY = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

export const configured = !!(URL_ && KEY);
export const isProd = !!env.PROD;

export const sb = configured
  ? createClient(URL_, KEY, {
      auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null;

/* ---------- row <-> app object mapping ---------- */
const dOut = (v) => (v ? String(v).slice(0, 10) : "");
const dIn = (v) => (v ? v : null);

export function profileFromRow(r) {
  return { id: r.id, name: r.full_name || "", email: r.email || "", role: r.role, lastSeen: r.last_seen || "", createdAt: r.created_at };
}
export function planFromRow(r) {
  return {
    id: r.id, name: r.name, description: r.description || "", color: r.color, code: r.code,
    members: r.members || [], buckets: r.buckets || [], labels: r.labels || [],
    createdBy: r.created_by, createdAt: r.created_at,
  };
}
const PLAN_MAP = { name: "name", description: "description", color: "color", code: "code", members: "members", buckets: "buckets", labels: "labels" };
export function planToRow(p) {
  const o = {};
  for (const k in PLAN_MAP) if (k in p) o[PLAN_MAP[k]] = p[k];
  return o;
}
export function taskFromRow(r) {
  return {
    id: r.id, planId: r.plan_id, num: r.num, bucketId: r.bucket_id, title: r.title, notes: r.notes || "",
    assignees: r.assignees || [], priority: r.priority, progress: r.progress,
    start: dOut(r.start_date), due: dOut(r.due_date), labels: r.labels || [], checklist: r.checklist || [],
    showChecklist: !!r.show_checklist, links: r.links || [], order: r.sort_order || 0, activity: r.activity || [],
    createdBy: r.created_by, createdAt: r.created_at, updatedBy: r.updated_by, updatedAt: r.updated_at,
    completedBy: r.completed_by || "", completedAt: r.completed_at || "",
  };
}
const TASK_MAP = {
  planId: "plan_id", bucketId: "bucket_id", title: "title", notes: "notes", assignees: "assignees",
  priority: "priority", progress: "progress", start: "start_date", due: "due_date", labels: "labels",
  checklist: "checklist", showChecklist: "show_checklist", links: "links", order: "sort_order",
  activity: "activity", completedBy: "completed_by", completedAt: "completed_at",
};
export function taskToRow(t) {
  const o = {};
  for (const k in TASK_MAP) {
    if (!(k in t)) continue;
    let v = t[k];
    if (k === "start" || k === "due") v = dIn(v);
    if ((k === "completedBy" || k === "completedAt") && !v) v = null;
    o[TASK_MAP[k]] = v;
  }
  return o;
}

/* ---------- errors ---------- */
export class ApiError extends Error {
  constructor(e) {
    super((e && e.message) || "Request failed");
    this.code = (e && e.code) || "";
    this.kind = /row-level security|permission denied|42501|Only admins|owner role|own role/i.test((e && (e.message + " " + e.code)) || "")
      ? "permission" : /Failed to fetch|NetworkError|network/i.test(this.message) ? "network" : "other";
  }
}
function check({ data, error }) {
  if (error) throw new ApiError(error);
  return data;
}
// Row Level Security makes a blocked update/delete affect 0 rows instead of failing; treat that as "not allowed".
function checkRows(res) {
  const rows = check(res);
  if (!rows || !rows.length) throw new ApiError({ message: "permission denied: no rows changed", code: "42501" });
  return rows;
}
async function fetchAll(table, order) {
  const out = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    let q = sb.from(table).select("*").range(from, from + page - 1);
    if (order) q = q.order(order, { ascending: true });
    const rows = check(await q);
    out.push(...rows);
    if (rows.length < page) break;
  }
  return out;
}

/* ---------- auth ---------- */
const here = () => location.origin + location.pathname;
export const auth = {
  async session() { return check(await sb.auth.getSession()).session; },
  onChange(cb) { return sb.auth.onAuthStateChange((event, session) => cb(event, session)); },
  async signIn(email, password) { return check(await sb.auth.signInWithPassword({ email, password })); },
  async signUp(name, email, password) {
    return check(await sb.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: here() } }));
  },
  async resetPassword(email) { return check(await sb.auth.resetPasswordForEmail(email, { redirectTo: here() })); },
  async updatePassword(password) { return check(await sb.auth.updateUser({ password })); },
  async signOut() { try { await sb.auth.signOut(); } catch (e) { /* already signed out */ } },
};

/* ---------- data ---------- */
export const api = {
  async myProfile(id) {
    const rows = check(await sb.from("profiles").select("*").eq("id", id));
    return rows[0] ? profileFromRow(rows[0]) : null;
  },
  async loadProfiles() { return (await fetchAll("profiles", "created_at")).map(profileFromRow); },
  async loadPlans() { return (await fetchAll("plans", "created_at")).map(planFromRow); },
  async loadTasks() { return (await fetchAll("tasks", "created_at")).map(taskFromRow); },

  async updateProfile(id, patch) {
    const o = {};
    if ("name" in patch) o.full_name = patch.name;
    if ("role" in patch) o.role = patch.role;
    if ("lastSeen" in patch) o.last_seen = patch.lastSeen || null;
    checkRows(await sb.from("profiles").update(o).eq("id", id).select("id"));
  },

  async createPlan(p) { return planFromRow(check(await sb.from("plans").insert(planToRow(p)).select().single())); },
  async updatePlan(id, patch) { checkRows(await sb.from("plans").update(planToRow(patch)).eq("id", id).select("id")); },
  async deletePlan(id) { checkRows(await sb.from("plans").delete().eq("id", id).select("id")); },

  async createTask(t) { return taskFromRow(check(await sb.from("tasks").insert(taskToRow(t)).select().single())); },
  async updateTask(id, patch) { checkRows(await sb.from("tasks").update(taskToRow(patch)).eq("id", id).select("id")); },
  async deleteTask(id) { checkRows(await sb.from("tasks").delete().eq("id", id).select("id")); },

  async listComments(taskId) {
    const rows = check(await sb.from("comments").select("*").eq("task_id", taskId).order("created_at", { ascending: true }));
    return rows.map((r) => ({ id: r.id, taskId: r.task_id, author: r.author, text: r.body, at: r.created_at }));
  },
  async addComment(taskId, planId, text) {
    check(await sb.from("comments").insert({ task_id: taskId, plan_id: planId, body: text }));
  },
  async deleteComment(id) { checkRows(await sb.from("comments").delete().eq("id", id).select("id")); },

  /* Live updates. handlers: {task(evt,obj|id), plans(), profiles(), status(s)} */
  subscribe(handlers) {
    const ch = sb
      .channel("taskboard-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, (p) => {
        if (p.eventType === "DELETE") handlers.task("delete", p.old && p.old.id);
        else handlers.task("upsert", taskFromRow(p.new));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "plans" }, () => handlers.plans())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => handlers.profiles())
      .subscribe((status) => handlers.status && handlers.status(status));
    return () => sb.removeChannel(ch);
  },
  subscribeComments(taskId, cb) {
    const ch = sb
      .channel("comments-" + taskId)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments", filter: "task_id=eq." + taskId }, () => cb())
      .subscribe();
    return () => sb.removeChannel(ch);
  },
};
