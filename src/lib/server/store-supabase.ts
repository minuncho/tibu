import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { StickerStyle } from "../types";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "./env";
import type { ReportRow, ReportStatus, StickerRow, Store } from "./store";
import { thumbPath } from "./thumb";

const BUCKET = "stickers";
const SAMPLE_WINDOW = 200;

let client: SupabaseClient | null = null;
// Service-role client: bypasses RLS, server only.
function db() {
  client ??= createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

type DbSticker = {
  id: string;
  serial_no: number;
  owner_id: string | null;
  name: string;
  bubble: string;
  style: StickerStyle;
  image_path: string;
  country: string | null;
  created_at: string;
};

type DbReport = {
  id: string;
  reporter_id: string;
  sticker_id: string;
  reason: ReportRow["reason"];
  status: ReportStatus;
  created_at: string;
};

function toRow(s: DbSticker): StickerRow {
  return {
    id: s.id,
    serialNo: Number(s.serial_no),
    ownerId: s.owner_id,
    name: s.name,
    bubble: s.bubble,
    style: s.style,
    imagePath: s.image_path,
    country: s.country,
    createdAt: s.created_at,
  };
}

function toReport(r: DbReport): ReportRow {
  return {
    id: r.id,
    reporterId: r.reporter_id,
    stickerId: r.sticker_id,
    reason: r.reason,
    status: r.status,
    createdAt: r.created_at,
  };
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

function count(res: { count: number | null; error: { message: string } | null }) {
  if (res.error) throw new Error(res.error.message);
  return res.count ?? 0;
}

const HEAD = { count: "exact", head: true } as const;

export const supabaseStore: Store = {
  async countGenerations(userId, date) {
    return count(
      await db().from("generations").select("id", HEAD).eq("user_id", userId).eq("local_date", date),
    );
  },
  async createGeneration(g) {
    check(
      await db()
        .from("generations")
        .insert({ id: g.id, user_id: g.userId, local_date: g.date, candidates: g.candidates }),
    );
  },
  async getGeneration(id) {
    const g = check(await db().from("generations").select("*").eq("id", id).maybeSingle());
    return g ? { id: g.id, userId: g.user_id, candidates: g.candidates, used: g.used } : null;
  },
  async claimGeneration(id) {
    const rows = check(
      await db()
        .from("generations")
        .update({ used: true })
        .eq("id", id)
        .eq("used", false)
        .select("id"),
    );
    return (rows?.length ?? 0) > 0;
  },

  async createSticker(s) {
    const row = check(
      await db()
        .from("stickers")
        .insert({
          owner_id: s.ownerId,
          name: s.name,
          bubble: s.bubble,
          style: s.style,
          image_path: s.imagePath,
          country: s.country,
          local_date: s.date,
        })
        .select("*")
        .single(),
    );
    return toRow(row);
  },
  async getSticker(id) {
    const row = check(await db().from("stickers").select("*").eq("id", id).maybeSingle());
    return row ? toRow(row) : null;
  },
  async setStickerHidden(id, hidden) {
    check(await db().from("stickers").update({ hidden }).eq("id", id));
  },
  async listRemovedMade(userId) {
    const rows = check(
      await db().from("stickers").select("*").eq("owner_id", userId).eq("hidden", true),
    );
    return (rows as DbSticker[]).map(toRow);
  },
  async listAllStickers(offset, limit) {
    const res = await db()
      .from("stickers")
      .select("*", { count: "exact" })
      .order("serial_no", { ascending: false })
      .range(offset, offset + limit - 1);
    if (res.error) throw new Error(res.error.message);
    return {
      total: res.count ?? 0,
      rows: (res.data as (DbSticker & { hidden: boolean })[]).map((s) => ({
        ...toRow(s),
        hidden: s.hidden,
      })),
    };
  },
  async countStickersMade(userId, date) {
    return count(
      await db().from("stickers").select("id", HEAD).eq("owner_id", userId).eq("local_date", date),
    );
  },
  async listMade(userId) {
    const rows = check(
      await db().from("stickers").select("*").eq("owner_id", userId).eq("hidden", false),
    );
    return (rows as DbSticker[]).map(toRow);
  },

  async sampleStickers(excludeOwnerId, limit) {
    // Take a window of up to SAMPLE_WINDOW stickers (all of them while the pool is small,
    // otherwise a window at a random position) and shuffle it, so the order is random.
    const total = count(await db().from("stickers").select("id", HEAD).eq("hidden", false));
    if (total === 0) return [];
    const offset = Math.floor(Math.random() * Math.max(1, total - SAMPLE_WINDOW + 1));
    const rows = check(
      await db()
        .from("stickers")
        .select("*")
        .eq("hidden", false)
        .order("serial_no")
        .range(offset, offset + SAMPLE_WINDOW - 1),
    ) as DbSticker[];
    const pool = rows.filter((s) => s.owner_id !== excludeOwnerId);
    for (let k = pool.length - 1; k > 0; k--) {
      const r = Math.floor(Math.random() * (k + 1));
      [pool[k], pool[r]] = [pool[r], pool[k]];
    }
    return pool.slice(0, limit).map(toRow);
  },
  async randomSticker(excludeOwnerId) {
    const rows = check(await db().rpc("random_sticker", { uid: excludeOwnerId }));
    const first = (rows as DbSticker[] | null)?.[0];
    return first ? toRow(first) : null;
  },
  async createDraw(d) {
    check(
      await db().from("draws").insert({
        user_id: d.userId,
        sticker_id: d.stickerId,
        local_date: d.date,
        used_credit: d.usedCredit,
      }),
    );
  },
  async countDailyDraws(userId, date) {
    return count(
      await db()
        .from("draws")
        .select("id", HEAD)
        .eq("user_id", userId)
        .eq("local_date", date)
        .eq("used_credit", false),
    );
  },
  async hasDrawn(userId, stickerId) {
    const n = count(
      await db().from("draws").select("id", HEAD).eq("user_id", userId).eq("sticker_id", stickerId),
    );
    return n > 0;
  },
  async listDrawn(userId) {
    const rows = check(
      await db()
        .from("draws")
        .select("id, created_at, stickers!inner(*)")
        .eq("user_id", userId)
        .eq("stickers.hidden", false)
        .order("created_at"),
    );
    return (rows as unknown as { id: string; created_at: string; stickers: DbSticker }[]).map(
      (r) => ({ drawId: r.id, drawnAt: r.created_at, sticker: toRow(r.stickers) }),
    );
  },
  async latestInAlbum(userId) {
    const [drawnRes, madeRes] = await Promise.all([
      db()
        .from("draws")
        .select("created_at, stickers!inner(*)")
        .eq("user_id", userId)
        .eq("stickers.hidden", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      db()
        .from("stickers")
        .select("*")
        .eq("owner_id", userId)
        .eq("hidden", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    const drawn = check(drawnRes) as unknown as { created_at: string; stickers: DbSticker } | null;
    const made = check(madeRes) as DbSticker | null;
    if (drawn && made) {
      return toRow(new Date(drawn.created_at) > new Date(made.created_at) ? drawn.stickers : made);
    }
    if (drawn) return toRow(drawn.stickers);
    return made ? toRow(made) : null;
  },

  async creditBalance(userId) {
    const rows = check(await db().from("credits").select("amount").eq("user_id", userId));
    return (rows as { amount: number }[]).reduce((sum, r) => sum + r.amount, 0);
  },
  async addCredit(userId, amount, reason) {
    check(await db().from("credits").insert({ user_id: userId, amount, reason }));
  },

  async createReport(r) {
    const res = await db()
      .from("reports")
      .insert({ reporter_id: r.reporterId, sticker_id: r.stickerId, reason: r.reason });
    // 23505: unique (reporter_id, sticker_id) violated, i.e. already reported
    if (res.error?.code === "23505") return false;
    if (res.error) throw new Error(res.error.message);
    return true;
  },
  async getReport(id) {
    const row = check(await db().from("reports").select("*").eq("id", id).maybeSingle());
    return row ? toReport(row) : null;
  },
  async listPendingReports() {
    const rows = check(
      await db()
        .from("reports")
        .select("*, stickers(*)")
        .eq("status", "pending")
        .order("created_at"),
    );
    return (rows as unknown as (DbReport & { stickers: DbSticker })[]).map((r) => ({
      ...toReport(r),
      sticker: toRow(r.stickers),
    }));
  },
  async pendingReportsForSticker(stickerId) {
    const rows = check(
      await db().from("reports").select("*").eq("sticker_id", stickerId).eq("status", "pending"),
    );
    return (rows as DbReport[]).map(toReport);
  },
  async setReportStatus(ids, status) {
    check(
      await db()
        .from("reports")
        .update({ status, resolved_at: new Date().toISOString() })
        .in("id", ids),
    );
  },

  async ensureUser(userId) {
    const found = await db().auth.admin.getUserById(userId);
    if (found.data.user) return;
    // Rows in every table point at auth.users, so Toss users get a row there too.
    // The address is a placeholder that can never receive mail or sign in.
    const res = await db().auth.admin.createUser({
      id: userId,
      email: `${userId}@toss.tibu.invalid`,
      email_confirm: true,
      user_metadata: { toss: true },
    });
    // Two first requests at once: the other one created it.
    if (res.error && !/already|exists|registered/i.test(res.error.message)) {
      throw new Error(res.error.message);
    }
  },

  async deleteAccount(userId) {
    // Converted images that never became a sticker go; sticker images stay.
    const [generations, stickers] = await Promise.all([
      db().from("generations").select("candidates").eq("user_id", userId),
      db().from("stickers").select("image_path").eq("owner_id", userId),
    ]);
    const kept = new Set((check(stickers) as { image_path: string }[]).map((s) => s.image_path));
    const unused = new Set<string>();
    for (const g of check(generations) as { candidates: Record<string, string> }[]) {
      for (const file of Object.values(g.candidates)) {
        if (kept.has(file)) continue;
        unused.add(file);
        unused.add(thumbPath(file));
      }
    }
    if (unused.size > 0) {
      const res = await db().storage.from(BUCKET).remove([...unused]);
      if (res.error) throw new Error(res.error.message);
    }
    // Foreign keys do the rest: stickers.owner_id becomes null, everything else cascades.
    const res = await db().auth.admin.deleteUser(userId);
    if (res.error) throw new Error(res.error.message);
  },

  async putFile(path, bytes, contentType) {
    // Paths are never reused, so browsers may keep the files for a year.
    const res = await db()
      .storage.from(BUCKET)
      .upload(path, bytes, { contentType, upsert: true, cacheControl: "31536000" });
    if (res.error) throw new Error(res.error.message);
  },
  fileUrl(path) {
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
  },
};
