import fs from "node:fs";
import crypto from "node:crypto";
const OUT = "/Users/tbronson/projects/moth-lamp/journal/raw-2026-10-11/";
const p1 = JSON.parse(fs.readFileSync(OUT + "post-580-1725Z.json", "utf8"));
const p2 = JSON.parse(fs.readFileSync(OUT + "post-580-page2-1725Z.json", "utf8"));
console.log("page1 returned", p1.comments_returned, "total", p1.comments_total, "has_more", p1.has_more, "next", JSON.stringify(p1.next_since), "now", p1.now_utc);
console.log("page2 returned", p2.comments_returned, "total", p2.comments_total, "has_more", p2.has_more, "next", JSON.stringify(p2.next_since), "now", p2.now_utc);
const sha = b => crypto.createHash("sha256").update(b).digest("hex");
const erp = [...(p1.comments||[]), ...(p2.comments||[])].filter(c => JSON.stringify(c.author||"").includes("erpin"));
erp.sort((a,b)=>a.id-b.id);
console.log("erpin rows total", erp.length, "id range", erp[0].id, "..", erp[erp.length-1].id);
const byState = {};
for (const c of erp) { const k = JSON.stringify(c.mod_state ?? null); byState[k] = (byState[k]||0)+1; }
console.log("by mod_state", JSON.stringify(byState));
console.log("standing erpin rows:");
for (const c of erp.filter(c => c.mod_state == null)) { const b = String(c.body||""); console.log("  c"+c.id, new Date(c.created_at).toISOString(), "len", b.length, "sha", sha(b).slice(0,16), "|", b.replace(/\s+/g," ").slice(0,80)); }
// the five post-scan copies and the whole current-day tail
const T = (s) => Date.parse(s);
const five = [[102154,"06:14:28.856"],[102336,"10:16:58.307"],[102454,"12:23:10.626"],[102613,"14:33:35.453"],[102698,"16:17:37.576"]];
console.log("collapse rows by id:");
for (const c of erp.slice(-8)) console.log("  c"+c.id, new Date(c.created_at).toISOString(), JSON.stringify(c.mod_state));
// lags for the five
const ev = { 102154:["2026-10-11T06:14:28.856Z","e25677"], 102336:["2026-10-11T10:16:58.307Z","e25752"], 102454:["2026-10-11T12:23:10.626Z","e25782"], 102613:["2026-10-11T14:33:35.453Z","e25806"], 102698:["2026-10-11T16:17:37.576Z","e25821"] };
for (const c of erp) if (ev[c.id]) { const lag = (T(ev[c.id][0]) - Number(c.created_at))/1000; console.log("  c"+c.id, new Date(c.created_at).toISOString(), "->", ev[c.id][0], "lag", lag.toFixed(3), "s"); }
// 21 counter ids
const counter = erp.filter(c => c.id >= 99656 && c.id <= 102061);
console.log("counter-range erpin rows", counter.length, "first", counter[0]?.id, new Date(counter[0]?.created_at).toISOString(), "last", counter[counter.length-1]?.id, new Date(counter[counter.length-1]?.created_at).toISOString(), "all collapsed", counter.every(c=>c.mod_state==="collapsed"));
