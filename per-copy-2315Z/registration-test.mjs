
import fs from "node:fs";
import crypto from "node:crypto";
import * as http from "/Users/tbronson/projects/moth-lamp/bin/http.mjs";
const OUT = "./";
const sha = b => crypto.createHash("sha256").update(b).digest("hex");
const BOUND = Date.parse("2026-10-11T22:45:00Z");

// --- 1. moderation window since the last row read at 17:16Z (e25838) ---
const ev = await http.get("/api/events?kind=moderation&since=25838");
fs.writeFileSync(OUT + "mod-events-2315Z.json", ev.text);
const ej = ev.json ?? JSON.parse(ev.text);
const rows = ej.events || [];
console.log("== moderation since 25838 ==");
console.log("now", ej.now_utc, "| rows", rows.length, "| has_more", ej.has_more, "| next_since", JSON.stringify(ej.next_since), "| latest_event_id", ej.latest_event_id);
const anchors = [], counts = [], others = [];
for (const e of rows) {
  const d = String(e.detail || "");
  const rec = { id: e.id, at: new Date(e.created_at).toISOString(), kind: e.kind, detail: d };
  if (/copies now|such copies/i.test(d)) counts.push(rec);
  if (/c66411/.test(d)) anchors.push(rec); else others.push(rec);
}
console.log("anchor-c66411 rows:", anchors.length);
for (const r of anchors) console.log("  e" + r.id, r.at, "|", r.detail.replace(/\s+/g, " ").slice(0, 200));
console.log("count rows:", counts.length);
for (const r of counts) console.log("  e" + r.id, r.at, "|", r.detail.replace(/\s+/g, " ").slice(0, 240));
console.log("other rows:", others.length);
for (const r of others) console.log("  e" + r.id, r.at, "| " + r.kind + " |", r.detail.replace(/\s+/g, " ").slice(0, 160));

// --- 2. post 580, all pages ---
console.log("\n== post 580 pages ==");
let since = null; const all = [];
for (let i = 1; i <= 6; i++) {
  const r = await http.get("/api/post/580" + (since ? "?since=" + encodeURIComponent(since) : ""));
  const j = r.json ?? JSON.parse(r.text);
  fs.writeFileSync(OUT + "post-580-page" + i + ".json", r.text);
  const cs = j.comments || [];
  all.push(...cs);
  console.log("page" + i, j.now_utc, "returned", j.comments_returned, "total", j.comments_total, "has_more", j.has_more, "next", JSON.stringify(j.next_since));
  if (!j.has_more || !j.next_since || j.next_since === since) break;
  since = j.next_since;
}
const seen = new Set(); const uniq = [];
for (const c of all) if (!seen.has(c.id)) { seen.add(c.id); uniq.push(c); }
console.log("union rows:", uniq.length, "distinct:", uniq.length);

// --- 3. analysis ---
const AUTHOR = c => JSON.stringify(c.author || "");
const erp = uniq.filter(c => AUTHOR(c).includes("erpin")).sort((a, b) => a.id - b.id);
console.log("\n== erpin ==");
console.log("erpin rows:", erp.length, "id range", erp[0]?.id, "..", erp[erp.length - 1]?.id);
const byState = {};
for (const c of erp) { const k = String(c.mod_state ?? "null"); byState[k] = (byState[k] || 0) + 1; }
console.log("by mod_state:", JSON.stringify(byState));
const standing = erp.filter(c => c.mod_state == null);
console.log("standing rows:", standing.length);
const CANON = "5dff7427007816a916170b522ada29a8351d5c64c78f591ebbfcc1ee463d2def";
let falsifier = [];
for (const c of standing) {
  const b = String(c.body || "");
  const h = sha(b), at = Number(c.created_at);
  const preBound = at < BOUND;
  console.log("  c" + c.id, new Date(at).toISOString(), "len", b.length, "sha", h.slice(0, 16), preBound ? "posted-before-22:45Z" : "posted-after-bound", h === CANON ? "*** CANON BODY ***" : "");
  if (c.id !== 66411 && h === CANON && preBound) falsifier.push(c.id);
}
console.log("FALSIFIER standing canon copy before 22:45Z:", JSON.stringify(falsifier));

// new erpin rows since the 17:15Z census (last id then: 102698)
const fresh = erp.filter(c => c.id > 102698);
console.log("new erpin rows since c102698:", fresh.length);
for (const c of fresh) {
  const b = String(c.body || "");
  console.log("  c" + c.id, new Date(Number(c.created_at)).toISOString(), "mod=" + JSON.stringify(c.mod_state ?? null), "len", b.length, "sha", sha(b).slice(0, 16));
}
// collapse events in this window mapping to erpin ids (from moderation rows)
const erpIds = new Set(erp.map(c => c.id));
for (const r of rows) {
  const m = r.detail.match(/c(\d{4,7})/g) || [];
  for (const x of m) { const id = Number(x.slice(1)); if (erpIds.has(id) && id > 102698) console.log("  moderation row e" + r.id + " names new erpin id c" + id + ":", r.detail.replace(/\s+/g, " ").slice(0, 160)); }
}
