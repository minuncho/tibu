// Local stand-in for Supabase, used when no keys are configured.
// Data lives in .demo-data/ (gitignored). Not for production.
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { StickerStyle } from "../types";
import type { DrawnRow, GenerationRow, ReportRow, StickerRow, Store } from "./store";

const DIR = path.join(process.cwd(), ".demo-data");
const DB_FILE = path.join(DIR, "db.json");
export const DEMO_FILES_DIR = path.join(DIR, "files");

type Db = {
  nextSerial: number;
  stickers: (StickerRow & { date: string; hidden: boolean })[];
  generations: (GenerationRow & { date: string })[];
  draws: {
    id: string;
    userId: string;
    stickerId: string;
    date: string;
    usedCredit: boolean;
    createdAt: string;
  }[];
  credits: { userId: string; amount: number; reason: string }[];
  reports: ReportRow[];
};

const SEEDS: [string, string, StickerStyle, string, string][] = [
  ["Mochi", "I only knocked over ONE cup today.", "2d", "/seed/cat.png", "JP"],
  ["Bori", "Walk? Did somebody say walk?!", "2d", "/seed/dog.png", "KR"],
  ["Tofu", "Carrots are a love language.", "2d", "/seed/rabbit.png", "FR"],
  ["Kong", "Zzz... five more sunflower seeds...", "2d", "/seed/hamster.png", "US"],
  ["Pico", "Good morning! Good morning! Good morning!", "2d", "/seed/bird.png", "BR"],
];

function load(): Db {
  if (fs.existsSync(DB_FILE)) return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  const db: Db = {
    nextSerial: 0,
    stickers: [],
    generations: [],
    draws: [],
    credits: [],
    reports: [],
  };
  for (const [name, bubble, style, imagePath, country] of SEEDS) {
    db.stickers.push({
      id: randomUUID(),
      serialNo: db.nextSerial++,
      ownerId: "seed-user",
      name,
      bubble,
      style,
      imagePath,
      country,
      bg: "white",
      createdAt: new Date().toISOString(),
      date: "2000-01-01",
      hidden: false,
    });
  }
  save(db);
  return db;
}

function save(db: Db) {
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

const visible = (db: Db) => db.stickers.filter((s) => !s.hidden);

export const demoStore: Store = {
  async countGenerations(userId, date) {
    return load().generations.filter((g) => g.userId === userId && g.date === date).length;
  },
  async createGeneration(g) {
    const db = load();
    db.generations.push({ ...g, used: false });
    save(db);
  },
  async getGeneration(id) {
    return load().generations.find((g) => g.id === id) ?? null;
  },
  async claimGeneration(id) {
    const db = load();
    const g = db.generations.find((x) => x.id === id);
    if (!g || g.used) return false;
    g.used = true;
    save(db);
    return true;
  },

  async createSticker(s) {
    const db = load();
    const row = {
      id: randomUUID(),
      serialNo: db.nextSerial++,
      ownerId: s.ownerId,
      name: s.name,
      bubble: s.bubble,
      style: s.style,
      imagePath: s.imagePath,
      country: s.country,
      bg: s.bg,
      createdAt: new Date().toISOString(),
      date: s.date,
      hidden: false,
    };
    db.stickers.push(row);
    save(db);
    return row;
  },
  async getSticker(id) {
    return load().stickers.find((s) => s.id === id) ?? null;
  },
  async setStickerHidden(id, hidden) {
    const db = load();
    const sticker = db.stickers.find((s) => s.id === id);
    if (sticker) sticker.hidden = hidden;
    save(db);
  },
  async listRemovedMade(userId) {
    return load().stickers.filter((s) => s.ownerId === userId && s.hidden);
  },
  async listAllStickers(offset, limit) {
    const all = [...load().stickers].sort((a, b) => b.serialNo - a.serialNo);
    return { total: all.length, rows: all.slice(offset, offset + limit) };
  },
  async countStickersMade(userId, date) {
    return load().stickers.filter((s) => s.ownerId === userId && s.date === date).length;
  },
  async listMade(userId) {
    return visible(load()).filter((s) => s.ownerId === userId);
  },

  async sampleStickers(excludeOwnerId, limit) {
    const pool = visible(load()).filter((s) => s.ownerId !== excludeOwnerId);
    return pool.sort(() => Math.random() - 0.5).slice(0, limit);
  },
  async randomSticker(excludeOwnerId) {
    const pool = visible(load()).filter((s) => s.ownerId !== excludeOwnerId);
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  },
  async createDraw(d) {
    const db = load();
    db.draws.push({ id: randomUUID(), ...d, createdAt: new Date().toISOString() });
    save(db);
  },
  async countDailyDraws(userId, date) {
    return load().draws.filter((d) => d.userId === userId && d.date === date && !d.usedCredit)
      .length;
  },
  async hasDrawn(userId, stickerId) {
    return load().draws.some((d) => d.userId === userId && d.stickerId === stickerId);
  },
  async listDrawn(userId) {
    const db = load();
    const stickers = visible(db);
    const out: DrawnRow[] = [];
    for (const d of db.draws) {
      if (d.userId !== userId) continue;
      const sticker = stickers.find((s) => s.id === d.stickerId);
      if (sticker) out.push({ drawId: d.id, drawnAt: d.createdAt, sticker });
    }
    return out;
  },
  async latestInAlbum(userId) {
    const drawn = (await this.listDrawn(userId)).at(-1);
    const made = (await this.listMade(userId)).at(-1);
    if (drawn && made) return drawn.drawnAt > made.createdAt ? drawn.sticker : made;
    return drawn?.sticker ?? made ?? null;
  },

  async creditBalance(userId) {
    return load()
      .credits.filter((c) => c.userId === userId)
      .reduce((sum, c) => sum + c.amount, 0);
  },
  async addCredit(userId, amount, reason) {
    const db = load();
    db.credits.push({ userId, amount, reason });
    save(db);
  },

  async createReport(r) {
    const db = load();
    if (db.reports.some((x) => x.reporterId === r.reporterId && x.stickerId === r.stickerId)) {
      return false;
    }
    db.reports.push({
      id: randomUUID(),
      ...r,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    save(db);
    return true;
  },
  async getReport(id) {
    return load().reports.find((r) => r.id === id) ?? null;
  },
  async listPendingReports() {
    const db = load();
    const out = [];
    for (const report of db.reports) {
      const sticker = db.stickers.find((s) => s.id === report.stickerId);
      if (report.status === "pending" && sticker) out.push({ ...report, sticker });
    }
    return out;
  },
  async pendingReportsForSticker(stickerId) {
    return load().reports.filter((r) => r.stickerId === stickerId && r.status === "pending");
  },
  async setReportStatus(ids, status) {
    const db = load();
    for (const report of db.reports) if (ids.includes(report.id)) report.status = status;
    save(db);
  },

  // The demo store has no account table; any id works.
  async ensureUser() {},

  async deleteAccount(userId) {
    const db = load();
    const kept = new Set(db.stickers.filter((s) => s.ownerId === userId).map((s) => s.imagePath));
    for (const g of db.generations.filter((x) => x.userId === userId)) {
      for (const file of new Set(Object.values(g.candidates))) {
        if (!kept.has(file)) fs.rmSync(path.join(DEMO_FILES_DIR, file), { force: true });
      }
    }
    for (const s of db.stickers) if (s.ownerId === userId) s.ownerId = null;
    db.generations = db.generations.filter((x) => x.userId !== userId);
    db.draws = db.draws.filter((x) => x.userId !== userId);
    db.credits = db.credits.filter((x) => x.userId !== userId);
    db.reports = db.reports.filter((x) => x.reporterId !== userId);
    save(db);
  },

  async putFile(filePath, bytes) {
    const full = path.join(DEMO_FILES_DIR, filePath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, bytes);
  },
  fileUrl(filePath) {
    return filePath.startsWith("/") ? filePath : `/api/files/${filePath}`;
  },
};
