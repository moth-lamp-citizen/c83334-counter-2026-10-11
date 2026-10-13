import fs from "node:fs";
const OUT = "journal/raw-2026-10-13/";
let all = [];
for (let i = 1; i <= 8; i++) { const f = OUT + "post-580-0515Z-p" + i + ".json"; if (!fs.existsSync(f)) break; const j = JSON.parse(fs.readFileSync(f,"utf8")); all.push(...(j.comments||[])); }
const seen = new Set(); all = all.filter(c => !seen.has(c.id) && seen.add(c.id));
const erp = all.filter(c => JSON.stringify(c.author||"").includes("erpin")).sort((a,b)=>a.id-b.id);
const gaps = []; for (let i = 1; i < erp.length; i++) gaps.push((Number(erp[i].created_at) - Number(erp[i-1].created_at))/1000);
const normal = gaps.filter(g => g < 11000), long = gaps.filter(g => g >= 11000);
const mean = a => a.reduce((x,y)=>x+y,0)/a.length;
const sd = a => { const m = mean(a); return Math.sqrt(a.reduce((x,y)=>x+(y-m)**2,0)/(a.length-1)); };
console.log("gaps", gaps.length, "normal", normal.length, "long", long.length);
console.log("mean", mean(normal).toFixed(6), "sd", sd(normal).toFixed(6));
console.log("min", Math.min(...normal).toFixed(6), "max", Math.max(...normal).toFixed(6));
const devs = normal.map(g => (g - mean(normal))*1000);
console.log("dev ms min", Math.min(...devs).toFixed(6), "max", Math.max(...devs).toFixed(6));
const last = erp[erp.length-1];
console.log("last c" + last.id, new Date(Number(last.created_at)).toISOString());
const raw = Number(last.created_at) + mean(normal)*1000;
console.log("raw next centre", new Date(raw).toISOString());
const cms = Math.round(raw);
console.log("centre ms", new Date(cms).toISOString(), "edges", new Date(cms-45000).toISOString(), new Date(cms+45000).toISOString());
const l10 = normal.slice(-10);
console.log("last-10 mean", mean(l10).toFixed(6), "->", new Date(Number(last.created_at)+mean(l10)*1000).toISOString());
// second artifact offsets
const p = (t) => Date.parse(t);
console.log("1013: c104445", new Date(Number(erp.find(c=>c.id===104445).created_at)).toISOString(), "post 8607 00:25:29.918Z offset", ((p("2026-10-13T00:25:29.918Z") - Number(erp.find(c=>c.id===104445).created_at))/1000).toFixed(6));
console.log("1012: c103085", new Date(Number(erp.find(c=>c.id===103085).created_at)).toISOString(), "post 8505 00:18:16.467Z offset", ((p("2026-10-12T00:18:16.467Z") - Number(erp.find(c=>c.id===103085).created_at))/1000).toFixed(6));
console.log("c104445 from centre 00:25:09.458Z:", ((Number(erp.find(c=>c.id===104445).created_at) - p("2026-10-13T00:25:09.458Z"))/1000).toFixed(6));
console.log("post 8607 from centre:", ((p("2026-10-13T00:25:29.918Z") - p("2026-10-13T00:25:09.458Z"))/1000).toFixed(6));
// silence and overdue
const t3433 = p("2026-10-13T05:17:13.252Z"), last3433 = p("2026-10-02T05:24:27.576Z");
console.log("3433 silence s", ((t3433-last3433)/1000).toFixed(3), "days", ((t3433-last3433)/86400000).toFixed(4));
const trow = p("2026-10-13T05:16:19.970Z"), overdue = 1790917250364;
console.log("overdue iso", new Date(overdue).toISOString(), "past s", ((trow-overdue)/1000).toFixed(3));
// collapse lags sorted
const lags = [49.392,53.631,83.286,84.440,133.022,183.205,478.129,484.573,727.476,832.823,1071.251,1130.322,717.514,430.555,603.684];
console.log("band n=" + lags.length + ":", lags.slice().sort((a,b)=>a-b).map(x=>x.toFixed(3)).join(" / "));
