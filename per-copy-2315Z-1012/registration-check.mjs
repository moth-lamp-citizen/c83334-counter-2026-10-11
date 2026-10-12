import fs from "node:fs";
import crypto from "node:crypto";
import * as http from "/Users/tbronson/projects/moth-lamp/bin/http.mjs";
const OUT = "/Users/tbronson/projects/moth-lamp/journal/raw-2026-10-12/";
const sha = b => crypto.createHash("sha256").update(b).digest("hex");
const CANON = "5dff7427007816a916170b522ada29a8351d5c64c78f591ebbfcc1ee463d2def";
const CENTRE = Date.parse("2026-10-12T18:22:58.054Z");
const WIN = [Date.parse("2026-10-12T18:22:13.054Z"), Date.parse("2026-10-12T18:23:43.054Z")];
const PRE = Date.parse("2026-10-12T22:45:00Z");
const TICK16 = Date.parse("2026-10-12T16:22:26.248Z");
console.log("== 23:15Z check of the c103939 registration (centre " + new Date(CENTRE).toISOString() + ", window 18:22:13.054-18:23:43.054Z) ==");
console.log("   also resolves the 16:22:26.248Z tick row (open at the 17:16:09Z read) and the copy standing/count clause");
console.log("now", new Date().toISOString());

// --- moderation, paged from e26101 ---
let since = 26101, modRows = [];
for (let i = 1; i <= 12; i++) {
  const r = await http.get("/api/events?kind=moderation&since=" + since);
  fs.writeFileSync(OUT + "mod-events-2315Z-p" + i + ".json", r.text);
  const j = r.json ?? JSON.parse(r.text);
  const rows = j.events || [];
  modRows.push(...rows);
  console.log("mod page" + i, j.now_utc, "rows", rows.length, "has_more", j.has_more, "next_since", JSON.stringify(j.next_since), "latest", j.latest_event_id);
  if (!j.has_more || !j.next_since || j.next_since === since) break;
  since = j.next_since;
}
const uniqE = new Map(); for (const e of modRows) uniqE.set(e.id, e);
modRows = [...uniqE.values()].sort((a, b) => a.id - b.id);
console.log("moderation rows since 26101:", modRows.length, "ids", modRows[0]?.id + ".." + modRows[modRows.length-1]?.id);
const anchors = modRows.filter(e => /c66411/.test(String(e.detail || "")));
console.log("rows naming c66411:", anchors.length);
for (const e of anchors) console.log("  e" + e.id, new Date(e.created_at).toISOString(), "|", String(e.detail).replace(/\s+/g, " ").slice(0, 200));
const counts = modRows.filter(e => /copies now|such copies/i.test(String(e.detail || "")));
console.log("count rows:", counts.length);
for (const r of counts) console.log("  e" + r.id, new Date(r.created_at).toISOString(), "|", String(r.detail).replace(/\s+/g, " ").slice(0, 240));
console.log("NEW moderation rows since the 17:15Z read (e>26141):", modRows.filter(e => e.id > 26141).length);
for (const e of modRows.filter(e => e.id > 26141)) console.log("  e" + e.id, new Date(e.created_at).toISOString(), "|", String(e.detail).replace(/\s+/g, " ").slice(0, 220));

// --- post 580, all pages ---
console.log("\n== post 580 pages ==");
let psince = null, all = [];
for (let i = 1; i <= 8; i++) {
  const r = await http.get("/api/post/580" + (psince ? "?since=" + encodeURIComponent(psince) : ""));
  const j = r.json ?? JSON.parse(r.text);
  fs.writeFileSync(OUT + "post-580-2315Z-p" + i + ".json", r.text);
  all.push(...(j.comments || []));
  console.log("page" + i, j.now_utc, "returned", j.comments_returned, "total", j.comments_total, "has_more", j.has_more, "next", JSON.stringify(j.next_since));
  if (!j.has_more || !j.next_since || j.next_since === psince) break;
  psince = j.next_since;
}
const seen = new Set(); all = all.filter(c => !seen.has(c.id) && seen.add(c.id));
console.log("union rows:", all.length);

// --- erpin analysis ---
const erp = all.filter(c => JSON.stringify(c.author || "").includes("erpin")).sort((a, b) => a.id - b.id);
console.log("\n== erpin ==");
console.log("rows", erp.length, "id range", erp[0]?.id + ".." + erp[erp.length - 1]?.id);
const byState = {}; for (const c of erp) { const k = String(c.mod_state ?? "null"); byState[k] = (byState[k] || 0) + 1; }
console.log("by mod_state:", JSON.stringify(byState));
const standing = erp.filter(c => c.mod_state == null);
console.log("standing rows:", standing.length);
const fals = [], lateCopies = [];
for (const c of standing) {
  const b = String(c.body || ""), h = sha(b), at = Number(c.created_at);
  console.log("  STANDING c" + c.id, new Date(at).toISOString(), "len", b.length, "sha", h.slice(0, 16), "posted-before-22:45Z:", at < PRE, h === CANON && c.id !== 66411 ? "*** CANON BODY ***" : "");
  if (c.id !== 66411 && h === CANON && at < PRE) fals.push(c.id);
  if (c.id !== 66411 && at >= Date.parse("2026-10-12T00:00:00Z")) lateCopies.push({ id: c.id, at: new Date(at).toISOString(), sha: h.slice(0,16), canon: h === CANON });
}
console.log("FALSIFIER standing canon copy before 22:45Z:", JSON.stringify(fals));
console.log("standing rows posted today:", JSON.stringify(lateCopies));

const fresh = erp.filter(c => c.id > 103939);
console.log("\nnew erpin rows since c103939 (17:15Z read):", fresh.length);
let prevAt = erp.find(c => c.id === 103939) ? Number(erp.find(c => c.id === 103939).created_at) : null;
for (const c of fresh) {
  const b = String(c.body || ""), at = Number(c.created_at);
  const mod = anchors.find(e => String(e.detail).includes("comment " + c.id + ":"));
  console.log("  c" + c.id, new Date(at).toISOString(), "gap-from-prev=" + ((at - prevAt)/1000).toFixed(3) + "s", "delta-from-18:22:58.054=" + (at - CENTRE) + "ms", "inside-window:", at >= WIN[0] && at <= WIN[1], "between-16:22-and-window:", at >= TICK16 && at < WIN[0], "mod=" + JSON.stringify(c.mod_state ?? null), "len", b.length, "sha", sha(b).slice(0, 16));
  console.log("    moderation:", mod ? String(mod.detail).replace(/\s+/g, " ").slice(0, 220) : "NO ROW NAMING THIS COMMENT");
  prevAt = at;
}

// --- cadence over the whole stream ---
const gaps = [];
for (let i = 1; i < erp.length; i++) gaps.push({ a: erp[i - 1].id, b: erp[i].id, gap: (Number(erp[i].created_at) - Number(erp[i - 1].created_at)) / 1000 });
const normal = gaps.filter(g => g.gap < 11000);
const long = gaps.filter(g => g.gap >= 11000);
const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
const sd = a => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
const ng = normal.map(g => g.gap);
console.log("\n== cadence ==");
console.log("gaps:", gaps.length, "normal<11000s:", ng.length, "long:", long.length);
for (const g of long) console.log("  LONG " + g.a + "->" + g.b + " " + g.gap.toFixed(3) + "s = " + (g.gap/7231.8).toFixed(3) + " slots");
console.log("normal mean", mean(ng).toFixed(3) + "s", "sd", sd(ng).toFixed(3) + "s", "min", Math.min(...ng).toFixed(3), "max", Math.max(...ng).toFixed(3));
const devs = ng.map(g => (g - mean(ng)) * 1000);
console.log("deviation ms: min", Math.min(...devs).toFixed(1), "max", Math.max(...devs).toFixed(1), "| beyond +-45000ms:", ng.filter(g => Math.abs(g - mean(ng)) * 1000 > 45000).length, "/", ng.length);
const last = erp[erp.length - 1];
const nxt = Number(last.created_at) + mean(ng) * 1000;
const last10 = ng.slice(-10);
console.log("last erpin c" + last.id, new Date(Number(last.created_at)).toISOString());
console.log("NEXT TICK (last + stream mean) =", new Date(nxt).toISOString(), "| -45s", new Date(nxt - 45000).toISOString(), "| +45s", new Date(nxt + 45000).toISOString());
console.log("NEXT TICK (last + last-10 mean) =", new Date(Number(last.created_at) + mean(last10) * 1000).toISOString(), "(", mean(last10).toFixed(3) + "s )");
const lags = [];
for (const e of anchors) {
  const mid = String(e.detail).match(/comment (\d+):/);
  if (!mid) continue;
  const c = erp.find(x => x.id === Number(mid[1]));
  if (c) lags.push({ id: c.id, lag: (Number(e.created_at) - Number(c.created_at)) / 1000 });
}
console.log("collapse-lag band n=" + lags.length + ":", lags.map(l => l.lag.toFixed(3)).join(" / "));
