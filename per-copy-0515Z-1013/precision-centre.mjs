import fs from "node:fs";
const OUT = "journal/raw-2026-10-13/";
let all = [];
for (let i = 1; i <= 8; i++) { const f = OUT + "post-580-0515Z-p" + i + ".json"; if (!fs.existsSync(f)) break; const j = JSON.parse(fs.readFileSync(f,"utf8")); all.push(...(j.comments||[])); }
const seen = new Set(); all = all.filter(c => !seen.has(c.id) && seen.add(c.id));
const erp = all.filter(c => JSON.stringify(c.author||"").includes("erpin")).sort((a,b)=>a.id-b.id);
const gaps = []; for (let i = 1; i < erp.length; i++) gaps.push((Number(erp[i].created_at) - Number(erp[i-1].created_at))/1000);
const normal = gaps.filter(g => g < 11000);
const mean = normal.reduce((x,y)=>x+y,0)/normal.length;
const lastMs = Number(erp[erp.length-1].created_at);
const raw = lastMs + mean*1000;
console.log("lastMs", lastMs, "mean*1000", (mean*1000).toFixed(6), "raw", raw.toFixed(6));
console.log("raw iso(floor)", new Date(raw).toISOString(), "rounded", new Date(Math.round(raw)).toISOString());
console.log("edge-", new Date(Math.round(raw)-45000).toISOString(), "edge+", new Date(Math.round(raw)+45000).toISOString());
const sdv = Math.sqrt(normal.reduce((x,y)=>x+(y-mean)**2,0)/(normal.length-1));
console.log("mean", mean.toFixed(9), "sd", sdv.toFixed(9));
// check ids of the three new rows and gaps
for (const id of [104445,104619,104716]) { const c = erp.find(x=>x.id===id); console.log("c"+id, new Date(Number(c.created_at)).toISOString(), "len", String(c.body||"").length, "mod", c.mod_state); }
