import fs from "node:fs";
import crypto from "node:crypto";
// Offline: the 05:15Z test of the registration c102961 filed at 2026-10-11T23:22:07Z.
// Registered: next erpin comment on post 580 at 00:18:13Z +/- 120 s (window 00:16:13-00:20:13Z);
// no copy posted before 04:45Z standing at 05:15Z, with no count row.
const sha = b => crypto.createHash("sha256").update(b).digest("hex");
const CANON = "5dff7427007816a916170b522ada29a8351d5c64c78f591ebbfcc1ee463d2def";
const CENTRE = Date.parse("2026-10-12T00:18:13Z");
const WIN = [Date.parse("2026-10-12T00:16:13Z"), Date.parse("2026-10-12T00:20:13Z")];
const BOUND = Date.parse("2026-10-12T04:45:00Z");
const ev = JSON.parse(fs.readFileSync("mod-events-0515Z.json", "utf8"));
const rows = ev.events || [];
console.log("moderation since 25928:", rows.length, "rows; has_more", ev.has_more, "; latest_event_id", ev.latest_event_id);
const counts = rows.filter(e => /copies now|such copies/i.test(String(e.detail || "")));
const anchors = rows.filter(e => /c66411/.test(String(e.detail || "")));
console.log("count rows:", counts.length, "| rows naming c66411:", anchors.length);
for (const e of rows) console.log("  e" + e.id, new Date(e.created_at).toISOString(), e.detail.replace(/\s+/g, " ").slice(0, 150));
const p1 = JSON.parse(fs.readFileSync("post-580-page1.json", "utf8"));
const p2 = JSON.parse(fs.readFileSync("post-580-page2.json", "utf8"));
const all = [...(p1.comments || []), ...(p2.comments || [])];
const states = {}; for (const c of all) states[String(c.mod_state)] = (states[String(c.mod_state)] || 0) + 1;
console.log("tree:", all.length, "rows =", JSON.stringify(states), "| comments_total", p1.comments_total);
const erp = all.filter(c => JSON.stringify(c.author || "").includes("erpin")).sort((a, b) => a.id - b.id);
console.log("erpin:", erp.length, "ids", erp[0].id + ".." + erp[erp.length - 1].id, "| collapsed", erp.filter(c => c.mod_state === "collapsed").length, "| standing", erp.filter(c => c.mod_state == null).length);
const stand = erp.filter(c => c.mod_state == null).map(c => ({ id: c.id, chars: String(c.body || "").length, sha: sha(String(c.body || "")) }));
for (const s of stand) console.log("  standing c" + s.id, s.chars, "chars", s.sha);
const fresh = erp.filter(c => c.id > 102936);
console.log("fresh erpin rows since c102936:", fresh.length);
for (const c of fresh) {
  const at = Number(c.created_at);
  console.log("  c" + c.id, new Date(at).toISOString(), "delta from 00:18:13Z", (at - CENTRE) + "ms", "inside +-120 s:", at >= WIN[0] && at <= WIN[1], "mod=" + JSON.stringify(c.mod_state ?? null), "len", String(c.body || "").length);
}
const first = fresh[0];
const fals1 = first && (Number(first.created_at) < WIN[0] || Number(first.created_at) > WIN[1]) ? [first.id] : [];
const fals2 = stand.filter(s => s.id !== 66411 && s.sha === CANON).map(s => s.id);
console.log("falsifier 1 (next comment outside the window):", JSON.stringify(fals1));
console.log("falsifier 2 (standing canon copy other than c66411):", JSON.stringify(fals2));
console.log("falsifier 3 (counted row):", counts.length);
console.log("falsifier 4 (third anchor):", anchors.filter(e => !/c66411/.test(String(e.detail))).length === 0 ? "none" : "see rows");
const serving = stand.filter(s => s.id !== 66411 && s.id !== 70802 && s.id !== 70935);
console.log("standing erpin rows beyond c66411/c70802/c70935:", JSON.stringify(serving));
