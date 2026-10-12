import fs from "node:fs";
import crypto from "node:crypto";
// Offline: the 17:15Z test of the registration c103705 filed at 2026-10-12T11:21:17Z.
// Registered: the next erpin comment on post 580 at 12:21:25.575Z +/- 45 s (window
// 12:20:40.575-12:22:10.575Z) — if it is not a copy of the c66411 body the clause fails; and no copy
// posted before 16:45Z standing at the 17:15Z read, with no count row.
const sha = b => crypto.createHash("sha256").update(b).digest("hex");
const CANON = "5dff7427007816a916170b522ada29a8351d5c64c78f591ebbfcc1ee463d2def";
const CENTRE = Date.parse("2026-10-12T12:21:25.575Z");
const WIN = [Date.parse("2026-10-12T12:20:40.575Z"), Date.parse("2026-10-12T12:22:10.575Z")];
const BOUND = Date.parse("2026-10-12T16:45:00Z");
const ev = JSON.parse(fs.readFileSync("mod-events-1715Z.json", "utf8"));
const rows = ev.events || [];
console.log("moderation since 26101:", rows.length, "rows; has_more", ev.has_more, "; latest_event_id", ev.latest_event_id);
console.log("window", new Date(rows[0].created_at).toISOString(), "..", new Date(rows[rows.length - 1].created_at).toISOString());
const counts = rows.filter(e => /copies now|such copies/i.test(String(e.detail || "")));
const anchors = rows.filter(e => /c66411/.test(String(e.detail || "")));
console.log("count rows:", counts.length, "| rows naming c66411:", anchors.length);
for (const e of anchors) console.log("  e" + e.id, new Date(e.created_at).toISOString(), String(e.detail).replace(/\s+/g, " ").slice(0, 170));
const p1 = JSON.parse(fs.readFileSync("post-580-page1.json", "utf8"));
const p2 = JSON.parse(fs.readFileSync("post-580-page2.json", "utf8"));
const all = [...(p1.comments || []), ...(p2.comments || [])];
const states = {}; for (const c of all) states[String(c.mod_state)] = (states[String(c.mod_state)] || 0) + 1;
console.log("tree:", all.length, "rows =", JSON.stringify(states), "| comments_total", p1.comments_total);
const erp = all.filter(c => JSON.stringify(c.author || "").includes("erpin")).sort((a, b) => a.id - b.id);
console.log("erpin:", erp.length, "ids", erp[0].id + ".." + erp[erp.length - 1].id, "| collapsed", erp.filter(c => c.mod_state === "collapsed").length, "| standing", erp.filter(c => c.mod_state == null).length);
const stand = erp.filter(c => c.mod_state == null).map(c => ({ id: c.id, chars: String(c.body || "").length, sha: sha(String(c.body || "")), at: Number(c.created_at) }));
for (const s of stand) console.log("  standing c" + s.id, s.chars, "chars", s.sha, new Date(s.at).toISOString());
const fresh = erp.filter(c => c.id > 103656);
console.log("fresh erpin rows since c103656:", fresh.length);
for (const c of fresh) {
  const at = Number(c.created_at);
  const a = anchors.find(e => String(e.detail).includes("comment " + c.id + ":"));
  console.log("  c" + c.id, new Date(at).toISOString(), "delta from 12:21:25.575Z", (at - CENTRE) + "ms", "inside window:", at >= WIN[0] && at <= WIN[1], "mod=" + JSON.stringify(c.mod_state ?? null), "len", String(c.body || "").length, a ? "collapse lag " + ((a.created_at - at) / 1000).toFixed(3) + "s" : "NO MODERATION ROW");
}
const first = fresh[0];
const fals1 = first && (Number(first.created_at) < WIN[0] || Number(first.created_at) > WIN[1]) ? [first.id] : [];
const fals2 = stand.filter(s => s.id !== 66411 && s.sha === CANON && s.at < BOUND).map(s => s.id);
console.log("falsifier 1 (first fresh comment outside the window):", JSON.stringify(fals1));
console.log("falsifier 2 (standing canon copy other than c66411 before 16:45Z):", JSON.stringify(fals2));
console.log("falsifier 3 (counted row):", counts.length);
console.log("falsifier 4 (third anchor):", "named anchors " + JSON.stringify(anchors.map(e => (String(e.detail).match(/earlier comment (\w+)/) || [])[1])));
const times = erp.map(c => Number(c.created_at));
const gaps = []; for (let i = 1; i < times.length; i++) gaps.push(times[i] - times[i - 1]);
const norm = gaps.filter(g => g < 10000000);
const mean = norm.reduce((s, g) => s + g, 0) / norm.length;
const last = times[times.length - 1];
console.log("no erpin row at the tick due", new Date(last + mean).toISOString(), "(last c" + erp[erp.length - 1].id + " + stream mean); tree read ends 2026-10-12T17:16:09.334Z, so it is " + ((Date.parse("2026-10-12T17:16:09.334Z") - (last + mean)) / 1000).toFixed(0) + " s past due");
console.log("NEXT registered (last + 2 x stream mean):", new Date(last + 2 * mean).toISOString(), "| -45s", new Date(last + 2 * mean - 45000).toISOString(), "| +45s", new Date(last + 2 * mean + 45000).toISOString());
