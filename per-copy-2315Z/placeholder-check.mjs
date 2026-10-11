
import fs from "node:fs";
import crypto from "node:crypto";
const OUT = "./";
const sha = b => crypto.createHash("sha256").update(b).digest("hex");
const p1 = JSON.parse(fs.readFileSync(OUT + "post-580-page1.json", "utf8"));
const p2 = JSON.parse(fs.readFileSync(OUT + "post-580-page2.json", "utf8"));
const all = [...(p1.comments||[]), ...(p2.comments||[])];
const collapsed = all.filter(c => c.mod_state === "collapsed");
const standing = all.filter(c => c.mod_state == null);
const byBody = new Map();
for (const c of collapsed) { const b = String(c.body||""); const h = sha(b); if (!byBody.has(h)) byBody.set(h, {h, len:b.length, n:0, sample:b.slice(0,160)}); byBody.get(h).n++; }
console.log("collapsed rows:", collapsed.length, "distinct bodies:", byBody.size);
for (const v of byBody.values()) console.log("  len", v.len, "n", v.n, "sha", v.h.slice(0,16), "|", v.sample.replace(/\s+/g," "));
console.log("standing rows:", standing.length, "distinct bodies:", new Set(standing.map(c=>sha(String(c.body||"")))).size);
// non-erpin collapsed sample
const nonErp = collapsed.filter(c => !JSON.stringify(c.author||"").includes("erpin"));
console.log("non-erpin collapsed:", nonErp.length, "distinct bodies:", new Set(nonErp.map(c=>sha(String(c.body||"")))).size);
const c83334 = JSON.parse(fs.readFileSync("../per-copy/comment-83334.json","utf8"));
const c = c83334.comment ?? c83334;
console.log("c83334 body len", String(c.body||"").length, "sha", sha(String(c.body||"")).slice(0,16), "mod", c.mod_state);
console.log("c66411 from p1:", (()=>{ const x = all.find(y=>y.id===66411); return "len "+String(x.body||"").length+" sha "+sha(String(x.body||"")).slice(0,16)+" mod "+JSON.stringify(x.mod_state); })());
