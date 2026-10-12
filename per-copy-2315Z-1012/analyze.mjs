import { readFileSync } from "node:fs";
const OUT = "journal/raw-2026-10-12/";
const p1 = JSON.parse(readFileSync(OUT + "post-580-2315Z-p1.json", "utf8"));
const p2 = JSON.parse(readFileSync(OUT + "post-580-2315Z-p2.json", "utf8"));
const all = [...(p1.comments||[]), ...(p2.comments||[])];
const seen = new Set(); const uniq = all.filter(c => !seen.has(c.id) && seen.add(c.id));
const st = {}; for (const c of uniq) { const k = String(c.mod_state ?? "null"); st[k] = (st[k]||0)+1; }
console.log("tree rows", uniq.length, "mod_state tally", JSON.stringify(st));
const erp = uniq.filter(c => JSON.stringify(c.author||"").includes("erpin")).sort((a,b)=>a.id-b.id);
const gaps = []; for (let i=1;i<erp.length;i++) gaps.push({a:erp[i-1].id,b:erp[i].id,t:Number(erp[i].created_at),gap:(Number(erp[i].created_at)-Number(erp[i-1].created_at))/1000});
const long = gaps.filter(g=>g.gap>=11000);
const T = 7231.869, T17 = 7231.8054, TQ = 7231.3;
const QUIET = Date.parse("2026-10-08T13:56:00Z");
const ts = ms => new Date(ms).toISOString();
console.log("long gaps:");
for (const g of long) {
  const k = Math.round(g.gap / T);
  console.log(" ", g.a+"->"+g.b, ts(g.t), "gap", g.gap.toFixed(3), "k="+k,
    "| off k*T(7231.869)="+(g.gap - k*T).toFixed(3), "| off k*T(7231.8054)="+(g.gap - k*T17).toFixed(3),
    "| off k*7231.3="+(g.gap - k*TQ).toFixed(3), "| quiet:", g.t>=QUIET);
}
const normal = gaps.filter(g=>g.gap<11000).map(g=>g.gap);
const mean = normal.reduce((s,x)=>s+x,0)/normal.length;
const sd = Math.sqrt(normal.reduce((s,x)=>s+(x-mean)**2,0)/(normal.length-1));
const devs = normal.map(g=>(g-mean)*1000);
console.log("normal n="+normal.length, "mean", mean.toFixed(3), "sd", sd.toFixed(3), "min", Math.min(...normal).toFixed(3), "max", Math.max(...normal).toFixed(3));
console.log("dev ms min", Math.min(...devs).toFixed(1), "max", Math.max(...devs).toFixed(1), "beyond±45:", normal.filter(g=>Math.abs(g-mean)*1000>45000).length);
console.log("gap c104214->c104307", (gaps.find(g=>g.a===104214).gap).toFixed(3), "off mean", (gaps.find(g=>g.a===104214).gap - mean).toFixed(3));
// new rows since c103939
const base = erp.find(c=>c.id===103939);
for (const c of erp.filter(c=>c.id>103939)) {
  const at = Number(c.created_at);
  console.log("new c"+c.id, ts(at), "gap-from-c103939", ((at-base.created_at)/1000).toFixed(3), "k="+(((at-base.created_at)/1000)/T).toFixed(4), "off k*T", (((at-base.created_at)/1000) - Math.round(((at-base.created_at)/1000)/T)*T).toFixed(3));
}
// borrowed-hour windows
const c103939 = Number(base.created_at);
for (const k of [3,4,5]) {
  const centre = c103939 + k*TQ*1000;
  const tol = 3*Math.sqrt(k)*2.22*1000;
  const row = erp.find(c => c.id > 103939 && Math.round((Number(c.created_at)-c103939)/1000/T)===k);
  console.log("bh k="+k, "centre", ts(centre), "tol ±"+(tol/1000).toFixed(2)+"s", "window", ts(centre-tol)+" .. "+ts(centre+tol), row ? ("row c"+row.id+" at "+ts(Number(row.created_at))+" offset "+((Number(row.created_at)-centre)/1000).toFixed(3)+"s "+(Math.abs(Number(row.created_at)-centre)<=tol?"INSIDE":"OUTSIDE")) : "no row");
}
