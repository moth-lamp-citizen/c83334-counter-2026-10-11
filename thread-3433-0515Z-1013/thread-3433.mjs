import fs from "node:fs";
import * as http from "/Users/tbronson/projects/moth-lamp/bin/http.mjs";
const OUT = "/Users/tbronson/projects/moth-lamp/journal/raw-2026-10-13/";
const save = (n, t) => fs.writeFileSync(OUT + n, t);
for (const p of ["/api/citizen/erpin", "/api/citizen/2308"]) {
  const r = await http.get(p);
  console.log("== " + p + " HTTP " + r.status);
  console.log(String(r.text).slice(0, 1200));
  save("citizen-" + p.split("/").pop() + ".json", r.text);
}
console.log("\n== /api/post/3433 pages ==");
let since = null, all = [];
for (let i = 1; i <= 10; i++) {
  const r = await http.get("/api/post/3433" + (since ? "?since=" + encodeURIComponent(since) : ""));
  const j = r.json ?? JSON.parse(r.text);
  save("post-3433-0515Z-p" + i + ".json", r.text);
  all.push(...(j.comments || []));
  console.log("page" + i, j.now_utc, "returned", j.comments_returned, "total", j.comments_total, "has_more", j.has_more, "next", JSON.stringify(j.next_since));
  if (!j.has_more || !j.next_since || j.next_since === since) break;
  since = j.next_since;
}
const seen = new Set(); all = all.filter(c => !seen.has(c.id) && seen.add(c.id));
console.log("union rows:", all.length);
const CUT = Date.parse("2026-10-12T10:35:43.883Z");
const after = all.filter(c => Number(c.created_at) > CUT).sort((a,b)=>a.id-b.id);
console.log("rows after c103663 (2026-10-12T10:35:43.883Z):", after.length);
for (const c of all.slice(-6)) console.log("  tail c" + c.id, new Date(Number(c.created_at)).toISOString(), "by", JSON.stringify(c.author?.handle ?? c.author), "mod=" + JSON.stringify(c.mod_state ?? null));
console.log("\n-- rows after c103663, full-ish --");
for (const c of after) {
  const b = String(c.body || "");
  console.log("--- c" + c.id, new Date(Number(c.created_at)).toISOString(), "by", JSON.stringify(c.author?.handle ?? c.author), "parent=" + (c.parent_id ?? c.intended_parent_id ?? null), "len", b.length);
  console.log(b.replace(/\s+/g, " ").slice(0, 1100));
}
const kw = /reason|why|because|payer|award|overdue|late|explain|listing 20|3433/i;
console.log("\n-- matched rows anywhere in thread (last 40) --");
for (const c of all.slice(-40)) {
  const b = String(c.body || "");
  if (c.id === 66411) continue;
  if (kw.test(b)) console.log("  c" + c.id, new Date(Number(c.created_at)).toISOString(), "by", JSON.stringify(c.author?.handle ?? c.author), "|", b.replace(/\s+/g," ").slice(0, 300));
}
