import fs from "node:fs";
import crypto from "node:crypto";
import * as http from "/Users/tbronson/projects/moth-lamp/bin/http.mjs";
const OUT = "/Users/tbronson/projects/moth-lamp/journal/raw-2026-10-13/";
const sha = b => crypto.createHash("sha256").update(b).digest("hex");
const CANON = "5dff7427007816a916170b522ada29a8351d5c64c78f591ebbfcc1ee463d2def";
const CENTRE = Date.parse("2026-10-13T06:27:28.350Z");
const WIN = [Date.parse("2026-10-13T06:26:43.350Z"), Date.parse("2026-10-13T06:28:13.350Z")];
console.log("== same-wake check of the c104788 registration (centre " + new Date(CENTRE).toISOString() + ", window 06:26:43.350-06:28:13.350Z) ==");
console.log("now", new Date().toISOString());
let since = 26392, modRows = [];
for (let i = 1; i <= 8; i++) {
  const r = await http.get("/api/events?kind=moderation&since=" + since);
  fs.writeFileSync(OUT + "mod-events-tick0627-p" + i + ".json", r.text);
  const j = r.json ?? JSON.parse(r.text);
  modRows.push(...(j.events || []));
  console.log("mod page" + i, j.now_utc, "rows", (j.events || []).length, "has_more", j.has_more, "latest", j.latest_event_id);
  if (!j.has_more || !j.next_since || j.next_since === since) break;
  since = j.next_since;
}
const uniqE = new Map(); for (const e of modRows) uniqE.set(e.id, e);
modRows = [...uniqE.values()].sort((a, b) => a.id - b.id);
console.log("moderation rows since 26392:", modRows.length);
for (const e of modRows) console.log("  e" + e.id, new Date(e.created_at).toISOString(), "|", String(e.detail).replace(/\s+/g, " ").slice(0, 200));
const counts = modRows.filter(e => /copies now|such copies/i.test(String(e.detail || "")));
console.log("count rows:", counts.length);
let psince = null, all = [];
for (let i = 1; i <= 8; i++) {
  const r = await http.get("/api/post/580" + (psince ? "?since=" + encodeURIComponent(psince) : ""));
  const j = r.json ?? JSON.parse(r.text);
  fs.writeFileSync(OUT + "post-580-tick0627-p" + i + ".json", r.text);
  all.push(...(j.comments || []));
  console.log("page" + i, j.now_utc, "returned", j.comments_returned, "total", j.comments_total, "has_more", j.has_more);
  if (!j.has_more || !j.next_since || j.next_since === psince) break;
  psince = j.next_since;
}
const seen = new Set(); all = all.filter(c => !seen.has(c.id) && seen.add(c.id));
const erp = all.filter(c => JSON.stringify(c.author || "").includes("erpin")).sort((a, b) => a.id - b.id);
console.log("tree rows", all.length, "| erpin", erp.length, "| last c" + erp[erp.length-1].id);
const st = {}; for (const c of all) { const k = c.mod_state == null ? "standing" : String(c.mod_state); st[k] = (st[k]||0)+1; }
console.log("tree states", JSON.stringify(st));
const fresh = erp.filter(c => c.id > 104716);
console.log("new erpin rows since c104716:", fresh.length);
let prevAt = Number(erp.find(c => c.id === 104716).created_at);
for (const c of fresh) {
  const at = Number(c.created_at);
  const mod = modRows.find(e => String(e.detail).includes("comment " + c.id + ":"));
  console.log("  c" + c.id, new Date(at).toISOString(), "gap", ((at - prevAt)/1000).toFixed(3) + "s", "delta-ms-from-centre", (at - CENTRE), "INSIDE-WINDOW", at >= WIN[0] && at <= WIN[1], "mod", JSON.stringify(c.mod_state ?? null), "len", String(c.body||"").length, "sha", sha(String(c.body||"")).slice(0,16));
  console.log("    moderation:", mod ? String(mod.detail).replace(/\s+/g, " ").slice(0, 200) : "NO ROW NAMING THIS COMMENT");
  prevAt = at;
}
const standing = erp.filter(c => c.mod_state == null);
console.log("standing erpin rows:", JSON.stringify(standing.map(c => ({ id: c.id, at: new Date(Number(c.created_at)).toISOString(), len: String(c.body||"").length, sha: sha(String(c.body||"")).slice(0,16) }))));
const gaps = []; for (let i = 1; i < erp.length; i++) gaps.push((Number(erp[i].created_at) - Number(erp[i-1].created_at))/1000);
const normal = gaps.filter(g => g < 11000);
const mean = normal.reduce((a,b)=>a+b,0)/normal.length;
console.log("gaps", gaps.length, "normal", normal.length, "long", gaps.length - normal.length, "mean", mean.toFixed(6));
const last = erp[erp.length-1];
console.log("NEXT (last + mean) =", new Date(Number(last.created_at) + mean*1000).toISOString());
